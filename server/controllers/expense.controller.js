const expenseService = require('../services/expense.service');

async function list(req, res, next) {
  try {
    const { category, from, to, limit, offset } = req.query;
    const result = await expenseService.list(req.business.id, { category, from, to, limit: Number(limit) || 50, offset: Number(offset) || 0 });
    res.json(result);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try { res.status(201).json({ expense: await expenseService.create(req.business.id, req.body) }); }
  catch (err) { next(err); }
}

async function update(req, res, next) {
  try { res.json({ expense: await expenseService.update(req.business.id, req.params.id, req.body) }); }
  catch (err) { next(err); }
}

async function remove(req, res, next) {
  try { await expenseService.remove(req.business.id, req.params.id); res.json({ success: true }); }
  catch (err) { next(err); }
}

module.exports = { list, create, update, remove };
