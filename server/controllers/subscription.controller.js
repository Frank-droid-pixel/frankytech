const subscriptionService = require('../services/subscription.service');
const audit = require('../utils/audit');

async function listPlans(req, res, next) {
  try { res.json({ plans: await subscriptionService.listPlans() }); }
  catch (err) { next(err); }
}

async function current(req, res, next) {
  try { res.json(await subscriptionService.getForBusiness(req.business.id)); }
  catch (err) { next(err); }
}

async function changePlan(req, res, next) {
  try {
    const result = await subscriptionService.changePlan(req.business.id, req.body.planCode);
    audit.log({ userId: req.session.user.id, businessId: req.business.id, action: 'subscription.change', resource: 'subscriptions', metadata: { planCode: req.body.planCode }, ipAddress: req.ip });
    res.json(result);
  }
  catch (err) { next(err); }
}

module.exports = { listPlans, current, changePlan };
