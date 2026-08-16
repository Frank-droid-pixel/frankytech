/**
 * FRANKY TECH — Expense Service
 * -----------------------------------------------------------
 */

const expenseModel = require('../models/expense.model');
const { AppError } = require('../middleware/errorHandler');

async function list(businessId, query) {
  const [items, total] = await Promise.all([
    expenseModel.list(businessId, query),
    expenseModel.count(businessId),
  ]);
  return { items, total };
}

async function create(businessId, fields) {
  if (!fields.category) throw new AppError('An expense category is required.', 422, { category: 'Required.' });
  if (!fields.amount || Number(fields.amount) <= 0) {
    throw new AppError('Expense amount must be greater than zero.', 422, { amount: 'Required, must be > 0.' });
  }
  return expenseModel.create(businessId, fields);
}

async function update(businessId, id, fields) {
  const existing = await expenseModel.findById(businessId, id);
  if (!existing) throw new AppError('Expense not found.', 404);
  return expenseModel.update(businessId, id, fields);
}

async function remove(businessId, id) {
  const existing = await expenseModel.findById(businessId, id);
  if (!existing) throw new AppError('Expense not found.', 404);
  return expenseModel.remove(businessId, id);
}

module.exports = { list, create, update, remove };
