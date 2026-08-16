/**
 * FRANKY TECH — Admin Model (Phase 24)
 * -----------------------------------------------------------
 * Platform-wide aggregates and cross-business user management.
 * Every query here is intentionally NOT scoped to a business —
 * that's the whole point of an admin view — so this file is
 * the one place in the codebase allowed to query across all
 * businesses at once. It must only ever be reached through
 * requireAdmin middleware.
 * -----------------------------------------------------------
 */
const { query } = require('../config/db');

async function platformStats() {
  const [
    users, activeUsers, newUsersThisMonth, businesses, payingBusinesses,
    revenue, reviews, feedback, referrals, invoiceVolume,
  ] = await Promise.all([
    query('SELECT COUNT(*)::int AS n FROM users'),
    query(`SELECT COUNT(*)::int AS n FROM users WHERE status = 'active'`),
    query(`SELECT COUNT(*)::int AS n FROM users WHERE created_at >= date_trunc('month', now())`),
    query('SELECT COUNT(*)::int AS n FROM businesses'),
    query(`SELECT COUNT(*)::int AS n FROM subscriptions s JOIN subscription_plans p ON p.id = s.plan_id WHERE p.price > 0 AND s.status = 'active'`),
    query(`SELECT COALESCE(SUM(p.price), 0)::float AS n FROM subscriptions s JOIN subscription_plans p ON p.id = s.plan_id WHERE s.status = 'active'`),
    query('SELECT COUNT(*)::int AS n FROM reviews'),
    query('SELECT COUNT(*)::int AS n FROM platform_feedback'),
    query(`SELECT COUNT(*)::int AS n FROM referral_rewards WHERE status IN ('qualified', 'paid')`),
    query('SELECT COUNT(*)::int AS n, COALESCE(SUM(total), 0)::float AS total FROM invoices'),
  ]);

  return {
    totalUsers: users.rows[0].n,
    activeUsers: activeUsers.rows[0].n,
    newUsersThisMonth: newUsersThisMonth.rows[0].n,
    totalBusinesses: businesses.rows[0].n,
    payingBusinesses: payingBusinesses.rows[0].n,
    monthlyRecurringRevenueEstimate: revenue.rows[0].n,
    totalReviews: reviews.rows[0].n,
    totalFeedback: feedback.rows[0].n,
    qualifiedReferrals: referrals.rows[0].n,
    invoiceCount: invoiceVolume.rows[0].n,
    invoiceVolumeTotal: invoiceVolume.rows[0].total,
  };
}

async function listUsers({ search, limit = 50, offset = 0 } = {}) {
  const params = [];
  let where = '1=1';
  if (search) {
    params.push(`%${search}%`);
    where += ` AND (full_name ILIKE $${params.length} OR email ILIKE $${params.length})`;
  }
  params.push(limit, offset);
  const { rows } = await query(
    `SELECT id, full_name, email, status, is_platform_admin, email_verified_at, created_at,
            (SELECT COUNT(*) FROM business_members WHERE user_id = users.id)::int AS business_count
       FROM users WHERE ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
}

async function setUserStatus(userId, status) {
  const { rows } = await query('UPDATE users SET status = $2, updated_at = now() WHERE id = $1 RETURNING id, status', [userId, status]);
  return rows[0] || null;
}

async function listBusinessesForUser(userId) {
  const { rows } = await query(
    `SELECT b.id, b.name, bm.role FROM businesses b JOIN business_members bm ON bm.business_id = b.id WHERE bm.user_id = $1`,
    [userId]
  );
  return rows;
}

async function listReviewsForModeration({ status = 'flagged', limit = 50 } = {}) {
  const { rows } = await query(
    `SELECT r.*, b.name AS business_name FROM reviews r JOIN businesses b ON b.id = r.business_id
      WHERE r.status = $1 ORDER BY r.created_at DESC LIMIT $2`,
    [status, limit]
  );
  return rows;
}

async function listFeedback({ status, limit = 50 } = {}) {
  const params = [];
  let where = '1=1';
  if (status) {
    params.push(status);
    where += ` AND status = $${params.length}`;
  }
  params.push(limit);
  const { rows } = await query(
    `SELECT f.*, u.full_name, u.email FROM platform_feedback f LEFT JOIN users u ON u.id = f.user_id
      WHERE ${where} ORDER BY f.created_at DESC LIMIT $${params.length}`,
    params
  );
  return rows;
}

async function updateFeedbackStatus(id, status) {
  const { rows } = await query('UPDATE platform_feedback SET status = $2 WHERE id = $1 RETURNING *', [id, status]);
  return rows[0] || null;
}

async function listPlans() {
  const { rows } = await query('SELECT * FROM subscription_plans ORDER BY sort_order ASC');
  return rows;
}

async function updatePlan(id, fields) {
  const allowed = ['name', 'price', 'currency', 'billing_interval', 'features', 'limits', 'is_active'];
  const sets = [];
  const values = [id];
  let i = 2;
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      sets.push(`${key} = $${i}`);
      values.push(key === 'features' || key === 'limits' ? JSON.stringify(fields[key]) : fields[key]);
      i += 1;
    }
  }
  if (sets.length === 0) return null;
  const { rows } = await query(`UPDATE subscription_plans SET ${sets.join(', ')} WHERE id = $1 RETURNING *`, values);
  return rows[0] || null;
}

async function listAnnouncements() {
  const { rows } = await query('SELECT * FROM platform_announcements ORDER BY created_at DESC');
  return rows;
}

async function createAnnouncement({ title, body, createdBy }) {
  const { rows } = await query(
    'INSERT INTO platform_announcements (title, body, created_by) VALUES ($1,$2,$3) RETURNING *',
    [title, body, createdBy]
  );
  return rows[0];
}

async function setAnnouncementActive(id, isActive) {
  const { rows } = await query('UPDATE platform_announcements SET is_active = $2 WHERE id = $1 RETURNING *', [id, isActive]);
  return rows[0] || null;
}

async function recentAuditLogs(limit = 100) {
  const { rows } = await query(
    `SELECT al.*, u.full_name, u.email FROM audit_logs al LEFT JOIN users u ON u.id = al.user_id
      ORDER BY al.created_at DESC LIMIT $1`,
    [limit]
  );
  return rows;
}

module.exports = {
  platformStats, listUsers, setUserStatus, listBusinessesForUser, listReviewsForModeration,
  listFeedback, updateFeedbackStatus, listPlans, updatePlan, listAnnouncements,
  createAnnouncement, setAnnouncementActive, recentAuditLogs,
};
