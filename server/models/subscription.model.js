const { query } = require('../config/db');

async function listPlans() {
  const { rows } = await query('SELECT * FROM subscription_plans WHERE is_active = true ORDER BY sort_order ASC');
  return rows;
}

async function findPlanByCode(code) {
  const { rows } = await query('SELECT * FROM subscription_plans WHERE code = $1', [code]);
  return rows[0] || null;
}

async function findForBusiness(businessId) {
  const { rows } = await query(
    `SELECT s.*, p.code AS plan_code, p.name AS plan_name, p.price, p.currency, p.billing_interval, p.features, p.limits
       FROM subscriptions s JOIN subscription_plans p ON p.id = s.plan_id
      WHERE s.business_id = $1`,
    [businessId]
  );
  return rows[0] || null;
}

async function upsertForBusiness(businessId, planId) {
  const { rows } = await query(
    `INSERT INTO subscriptions (business_id, plan_id, status, current_period_end)
     VALUES ($1, $2, 'active', now() + interval '30 days')
     ON CONFLICT (business_id) DO UPDATE SET plan_id = EXCLUDED.plan_id, status = 'active',
       current_period_end = now() + interval '30 days', updated_at = now()
     RETURNING *`,
    [businessId, planId]
  );
  return rows[0];
}

/** Current usage counts, compared against the plan's `limits` JSON on the service layer. */
async function usageForBusiness(businessId) {
  const { rows } = await query(
    `SELECT
      (SELECT COUNT(*) FROM invoices WHERE business_id = $1 AND created_at >= date_trunc('month', now()))::int AS invoices_this_month,
      (SELECT COUNT(*) FROM business_members WHERE business_id = $1)::int AS team_members,
      (SELECT COUNT(DISTINCT business_id) FROM business_members WHERE user_id = (SELECT owner_id FROM businesses WHERE id = $1))::int AS businesses_owned`,
    [businessId]
  );
  return rows[0];
}

module.exports = { listPlans, findPlanByCode, findForBusiness, upsertForBusiness, usageForBusiness };
