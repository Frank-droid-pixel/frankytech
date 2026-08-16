/**
 * FRANKY TECH — Subscription Service (Phase 18)
 * -----------------------------------------------------------
 * Plans and limits are database-driven (subscription_plans),
 * never hard-coded. No live payment gateway is wired up yet
 * (that's Phase 19's webhook verification) — "upgrading" here
 * assigns the plan directly, which is honest for a
 * pre-payment-integration state rather than faking a checkout.
 * -----------------------------------------------------------
 */
const subscriptionModel = require('../models/subscription.model');
const { AppError } = require('../middleware/errorHandler');

async function listPlans() {
  return subscriptionModel.listPlans();
}

async function getForBusiness(businessId) {
  let sub = await subscriptionModel.findForBusiness(businessId);
  if (!sub) {
    // Every business defaults to the Free plan the moment it's checked.
    const freePlan = await subscriptionModel.findPlanByCode('free');
    if (freePlan) {
      await subscriptionModel.upsertForBusiness(businessId, freePlan.id);
      sub = await subscriptionModel.findForBusiness(businessId);
    }
  }
  const usage = await subscriptionModel.usageForBusiness(businessId);
  return { subscription: sub, usage };
}

async function changePlan(businessId, planCode) {
  const plan = await subscriptionModel.findPlanByCode(planCode);
  if (!plan) throw new AppError('Unknown subscription plan.', 404);
  await subscriptionModel.upsertForBusiness(businessId, plan.id);
  return getForBusiness(businessId);
}

/** Never deletes data when a limit is reached (spec §54) — only blocks new creation. */
async function assertWithinLimit(businessId, limitKey, currentCount) {
  const { subscription } = await getForBusiness(businessId);
  const limit = subscription?.limits?.[limitKey];
  if (limit === null || limit === undefined) return; // unlimited
  if (currentCount >= limit) {
    throw new AppError(`Your ${subscription.plan_name} plan allows up to ${limit} for this — upgrade to add more.`, 402);
  }
}

module.exports = { listPlans, getForBusiness, changePlan, assertWithinLimit };
