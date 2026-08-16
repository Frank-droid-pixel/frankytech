const referralService = require('../services/referral.service');

async function dashboard(req, res, next) {
  try { res.json(await referralService.dashboardData(req.session.user)); }
  catch (err) { next(err); }
}

async function trackClick(req, res, next) {
  try {
    await referralService.recordClick(req.params.code, req.ip);
    res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = { dashboard, trackClick };
