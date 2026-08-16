const notificationService = require('../services/notification.service');
const automationService = require('../services/automation.service');

async function list(req, res, next) {
  try {
    await automationService.runBusinessChecks(req.business.id);
    res.json(await notificationService.listForBusiness(req.business.id));
  } catch (err) { next(err); }
}

async function markRead(req, res, next) {
  try { res.json({ notification: await notificationService.markRead(req.business.id, req.params.id) }); }
  catch (err) { next(err); }
}

async function markAllRead(req, res, next) {
  try { await notificationService.markAllRead(req.business.id); res.json({ success: true }); }
  catch (err) { next(err); }
}

module.exports = { list, markRead, markAllRead };
