/**
 * FRANKY TECH — Item Service (products + services)
 * -----------------------------------------------------------
 */

const itemModel = require('../models/item.model');
const inventoryModel = require('../models/inventory.model');
const { AppError } = require('../middleware/errorHandler');

async function list(businessId, query) {
  const [items, total] = await Promise.all([
    itemModel.list(businessId, query),
    itemModel.count(businessId, query.type),
  ]);
  return { items, total };
}

async function get(businessId, id) {
  const item = await itemModel.findById(businessId, id);
  if (!item) throw new AppError('Item not found.', 404);
  return item;
}

async function create(businessId, fields) {
  if (!fields.name || String(fields.name).trim().length < 2) {
    throw new AppError('Name must be at least 2 characters.', 422, { name: 'Required, min 2 characters.' });
  }
  if (fields.price !== undefined && Number(fields.price) < 0) {
    throw new AppError('Price cannot be negative.', 422, { price: 'Must be zero or greater.' });
  }
  return itemModel.create(businessId, fields);
}

async function update(businessId, id, fields) {
  const existing = await itemModel.findById(businessId, id);
  if (!existing) throw new AppError('Item not found.', 404);
  return itemModel.update(businessId, id, fields);
}

async function remove(businessId, id) {
  const existing = await itemModel.findById(businessId, id);
  if (!existing) throw new AppError('Item not found.', 404);
  return itemModel.remove(businessId, id);
}

/** Manual stock adjustment (Phase 13 — Inventory), always logged. */
async function adjustStock(businessId, id, { quantityDelta, note, userId }) {
  const existing = await itemModel.findById(businessId, id);
  if (!existing) throw new AppError('Item not found.', 404);
  if (existing.type !== 'product') throw new AppError('Only products carry stock.', 422);

  const newQty = Number(existing.quantity) + Number(quantityDelta);
  if (newQty < 0) throw new AppError('Adjustment would make stock negative.', 422);

  const updated = await itemModel.adjustStock(businessId, id, quantityDelta);
  await inventoryModel.record(null, {
    businessId,
    itemId: id,
    type: quantityDelta >= 0 ? 'stock_in' : 'adjustment',
    quantity: quantityDelta,
    referenceType: 'manual',
    note: note || 'Manual stock adjustment',
    createdBy: userId,
  });
  return updated;
}

async function lowStockAlerts(businessId) {
  return itemModel.lowStock(businessId);
}

module.exports = { list, get, create, update, remove, adjustStock, lowStockAlerts };
