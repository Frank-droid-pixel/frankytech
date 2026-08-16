const customerService = require('../services/customer.service');

async function list(req, res, next) {
  try {
    const { search, limit, offset } = req.query;
    const result = await customerService.list(req.business.id, { search, limit: Number(limit) || 50, offset: Number(offset) || 0 });
    res.json(result);
  } catch (err) { next(err); }
}

async function get(req, res, next) {
  try { res.json({ customer: await customerService.get(req.business.id, req.params.id) }); }
  catch (err) { next(err); }
}

async function create(req, res, next) {
  try { res.status(201).json({ customer: await customerService.create(req.business.id, req.body) }); }
  catch (err) { next(err); }
}

async function update(req, res, next) {
  try { res.json({ customer: await customerService.update(req.business.id, req.params.id, req.body) }); }
  catch (err) { next(err); }
}

async function remove(req, res, next) {
  try { await customerService.remove(req.business.id, req.params.id); res.json({ success: true }); }
  catch (err) { next(err); }
}

module.exports = { list, get, create, update, remove };
