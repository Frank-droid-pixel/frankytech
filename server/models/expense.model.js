/**
 * FRANKY TECH — Expense Model
 * -----------------------------------------------------------
 */

const { query } = require('../config/db');

async function list(businessId, { category, from, to, limit = 50, offset = 0 } = {}) {
  const params = [businessId];
  let where = 'business_id = $1';
  if (category) {
    params.push(category);
    where += ` AND category = $${params.length}`;
  }
  if (from) {
    params.push(from);
    where += ` AND expense_date >= $${params.length}`;
  }
  if (to) {
    params.push(to);
    where += ` AND expense_date <= $${params.length}`;
  }
  params.push(limit, offset);
  const { rows } = await query(
    `SELECT * FROM expenses WHERE ${where} ORDER BY expense_date DESC, created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
}

async function count(businessId) {
  const { rows } = await query('SELECT COUNT(*)::int AS n FROM expenses WHERE business_id = $1', [businessId]);
  return rows[0].n;
}

async function findById(businessId, id) {
  const { rows } = await query('SELECT * FROM expenses WHERE business_id = $1 AND id = $2', [businessId, id]);
  return rows[0] || null;
}

async function create(businessId, fields) {
  const { category, description, amount, currency, expenseDate, paymentMethod, notes } = fields;
  const { rows } = await query(
    `INSERT INTO expenses (business_id, category, description, amount, currency, expense_date, payment_method, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [businessId, category, description || null, amount, currency || 'USD', expenseDate || new Date(), paymentMethod || 'cash', notes || null]
  );
  return rows[0];
}

async function update(businessId, id, fields) {
  const allowed = ['category', 'description', 'amount', 'currency', 'expense_date', 'payment_method', 'notes'];
  const sets = [];
  const values = [businessId, id];
  let i = 3;
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      sets.push(`${key} = $${i}`);
      values.push(fields[key]);
      i += 1;
    }
  }
  if (sets.length === 0) return findById(businessId, id);
  const { rows } = await query(
    `UPDATE expenses SET ${sets.join(', ')}, updated_at = now() WHERE business_id = $1 AND id = $2 RETURNING *`,
    values
  );
  return rows[0] || null;
}

async function remove(businessId, id) {
  const { rowCount } = await query('DELETE FROM expenses WHERE business_id = $1 AND id = $2', [businessId, id]);
  return rowCount > 0;
}

async function totalForPeriod(businessId, from, to) {
  const { rows } = await query(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE business_id = $1 AND expense_date BETWEEN $2 AND $3`,
    [businessId, from, to]
  );
  return Number(rows[0].total);
}

async function byCategory(businessId, from, to) {
  const { rows } = await query(
    `SELECT category, COALESCE(SUM(amount), 0)::float AS total, COUNT(*)::int AS count
       FROM expenses WHERE business_id = $1 AND expense_date BETWEEN $2 AND $3
      GROUP BY category ORDER BY total DESC`,
    [businessId, from, to]
  );
  return rows;
}

module.exports = { list, count, findById, create, update, remove, totalForPeriod, byCategory };
