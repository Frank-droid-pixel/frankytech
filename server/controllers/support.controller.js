const supportService = require('../services/support.service');

async function list(req, res, next) {
  try { res.json({ tickets: await supportService.listForBusiness(req.business.id) }); }
  catch (err) { next(err); }
}

async function create(req, res, next) {
  try { res.status(201).json({ ticket: await supportService.createTicket(req.business.id, req.session.user.id, req.body) }); }
  catch (err) { next(err); }
}

async function get(req, res, next) {
  try { res.json({ ticket: await supportService.getTicket(req.business.id, req.params.id) }); }
  catch (err) { next(err); }
}

async function reply(req, res, next) {
  try { res.status(201).json({ message: await supportService.reply(req.business.id, req.params.id, req.session.user.id, req.body.message) }); }
  catch (err) { next(err); }
}

async function updateStatus(req, res, next) {
  try { res.json({ ticket: await supportService.updateStatus(req.business.id, req.params.id, req.body.status) }); }
  catch (err) { next(err); }
}

module.exports = { list, create, get, reply, updateStatus };
