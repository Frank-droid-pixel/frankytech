const itemService = require('../services/item.service');

async function list(req, res, next) {
  try {
    const { search, type, limit, offset } = req.query;
    const result = await itemService.list(req.business.id, { search, type, limit: Number(limit) || 100, offset: Number(offset) || 0 });
    res.json(result);
  } catch (err) { next(err); }
}

async function get(req, res, next) {
  try { res.json({ item: await itemService.get(req.business.id, req.params.id) }); }
  catch (err) { next(err); }
}

async function create(req, res, next) {
  try { res.status(201).json({ item: await itemService.create(req.business.id, req.body) }); }
  catch (err) { next(err); }
}

async function update(req, res, next) {
  try { res.json({ item: await itemService.update(req.business.id, req.params.id, req.body) }); }
  catch (err) { next(err); }
}

async function remove(req, res, next) {
  try { await itemService.remove(req.business.id, req.params.id); res.json({ success: true }); }
  catch (err) { next(err); }
}

async function adjustStock(req, res, next) {
  try {
    const item = await itemService.adjustStock(req.business.id, req.params.id, {
      quantityDelta: Number(req.body.quantityDelta),
      note: req.body.note,
      userId: req.session.user.id,
    });
    res.json({ item });
  } catch (err) { next(err); }
}

async function lowStock(req, res, next) {
  try { res.json({ items: await itemService.lowStockAlerts(req.business.id) }); }
  catch (err) { next(err); }
}

module.exports = { list, get, create, update, remove, adjustStock, lowStock };
