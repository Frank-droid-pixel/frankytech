/**
 * FRANKY TECH — Customer Service
 * -----------------------------------------------------------
 */

const customerModel = require('../models/customer.model');
const { AppError } = require('../middleware/errorHandler');

async function list(businessId, query) {
  const [items, total] = await Promise.all([
    customerModel.list(businessId, query),
    customerModel.count(businessId),
  ]);
  return { items, total };
}

async function get(businessId, id) {
  const customer = await customerModel.withBalance(businessId, id);
  if (!customer) throw new AppError('Customer not found.', 404);
  return customer;
}

async function create(businessId, fields) {
  if (!fields.name || String(fields.name).trim().length < 2) {
    throw new AppError('Customer name must be at least 2 characters.', 422, { name: 'Required, min 2 characters.' });
  }
  return customerModel.create(businessId, fields);
}

async function update(businessId, id, fields) {
  const existing = await customerModel.findById(businessId, id);
  if (!existing) throw new AppError('Customer not found.', 404);
  return customerModel.update(businessId, id, fields);
}

async function remove(businessId, id) {
  const existing = await customerModel.findById(businessId, id);
  if (!existing) throw new AppError('Customer not found.', 404);
  return customerModel.remove(businessId, id);
}

module.exports = { list, get, create, update, remove };
