/**
 * FRANKY TECH — Customer Model
 * -----------------------------------------------------------
 * Every query is scoped by business_id — this is the data
 * isolation boundary for customer records.
 * -----------------------------------------------------------
 */

const { query } = require('../config/db');

async function list(businessId, { search, limit = 50, offset = 0 } = {}) {
  const params = [businessId];
  let where = 'business_id = $1';
  if (search) {
    params.push(`%${search}%`);
    where += ` AND (name ILIKE $${params.length} OR company ILIKE $${params.length} OR email ILIKE $${params.length} OR phone ILIKE $${params.length})`;
  }
  params.push(limit, offset);
  const { rows } = await query(
    `SELECT * FROM customers WHERE ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
}

async function count(businessId) {
  const { rows } = await query('SELECT COUNT(*)::int AS n FROM customers WHERE business_id = $1', [businessId]);
  return rows[0].n;
}

async function findById(businessId, id) {
  const { rows } = await query('SELECT * FROM customers WHERE business_id = $1 AND id = $2', [businessId, id]);
  return rows[0] || null;
}

async function create(businessId, fields) {
  const { name, company, phone, email, address, country, taxId, notes } = fields;
  const { rows } = await query(
    `INSERT INTO customers (business_id, name, company, phone, email, address, country, tax_id, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [businessId, name, company || null, phone || null, email || null, address || null, country || null, taxId || null, notes || null]
  );
  return rows[0];
}

async function update(businessId, id, fields) {
  const allowed = ['name', 'company', 'phone', 'email', 'address', 'country', 'tax_id', 'notes'];
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
    `UPDATE customers SET ${sets.join(', ')}, updated_at = now() WHERE business_id = $1 AND id = $2 RETURNING *`,
    values
  );
  return rows[0] || null;
}

async function remove(businessId, id) {
  const { rowCount } = await query('DELETE FROM customers WHERE business_id = $1 AND id = $2', [businessId, id]);
  return rowCount > 0;
}

/** Balance = sum of outstanding invoice balances for this customer. */
async function withBalance(businessId, id) {
  const { rows } = await query(
    `SELECT c.*, COALESCE(SUM(i.balance_amount), 0) AS balance
       FROM customers c
       LEFT JOIN invoices i ON i.customer_id = c.id AND i.status != 'cancelled'
      WHERE c.business_id = $1 AND c.id = $2
      GROUP BY c.id`,
    [businessId, id]
  );
  return rows[0] || null;
}

module.exports = { list, count, findById, create, update, remove, withBalance };
