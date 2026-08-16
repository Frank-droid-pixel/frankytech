/**
 * FRANKY TECH — Item Model (products + services)
 * -----------------------------------------------------------
 */

const { query } = require('../config/db');

async function list(businessId, { search, type, limit = 100, offset = 0 } = {}) {
  const params = [businessId];
  let where = 'business_id = $1';
  if (type) {
    params.push(type);
    where += ` AND type = $${params.length}`;
  }
  if (search) {
    params.push(`%${search}%`);
    where += ` AND (name ILIKE $${params.length} OR sku ILIKE $${params.length} OR category ILIKE $${params.length})`;
  }
  params.push(limit, offset);
  const { rows } = await query(
    `SELECT * FROM items WHERE ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
}

async function count(businessId, type) {
  const params = [businessId];
  let where = 'business_id = $1';
  if (type) {
    params.push(type);
    where += ' AND type = $2';
  }
  const { rows } = await query(`SELECT COUNT(*)::int AS n FROM items WHERE ${where}`, params);
  return rows[0].n;
}

async function findById(businessId, id) {
  const { rows } = await query('SELECT * FROM items WHERE business_id = $1 AND id = $2', [businessId, id]);
  return rows[0] || null;
}

async function create(businessId, fields) {
  const {
    type, name, sku, category, description, cost, price, taxRate,
    unit, quantity, minStock, durationMinutes,
  } = fields;
  const { rows } = await query(
    `INSERT INTO items (business_id, type, name, sku, category, description, cost, price, tax_rate, unit, quantity, min_stock, duration_minutes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [
      businessId, type || 'product', name, sku || null, category || null, description || null,
      cost || 0, price || 0, taxRate || 0, unit || 'unit', quantity || 0, minStock || 0, durationMinutes || null,
    ]
  );
  return rows[0];
}

async function update(businessId, id, fields) {
  const allowed = ['name', 'sku', 'category', 'description', 'cost', 'price', 'tax_rate', 'unit', 'min_stock', 'duration_minutes', 'is_active'];
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
    `UPDATE items SET ${sets.join(', ')}, updated_at = now() WHERE business_id = $1 AND id = $2 RETURNING *`,
    values
  );
  return rows[0] || null;
}

async function remove(businessId, id) {
  const { rowCount } = await query('DELETE FROM items WHERE business_id = $1 AND id = $2', [businessId, id]);
  return rowCount > 0;
}

async function adjustStock(businessId, id, deltaQuantity) {
  const { rows } = await query(
    `UPDATE items SET quantity = quantity + $3, updated_at = now()
      WHERE business_id = $1 AND id = $2 RETURNING *`,
    [businessId, id, deltaQuantity]
  );
  return rows[0] || null;
}

async function lowStock(businessId) {
  const { rows } = await query(
    `SELECT * FROM items WHERE business_id = $1 AND type = 'product' AND is_active = true AND quantity <= min_stock ORDER BY quantity ASC`,
    [businessId]
  );
  return rows;
}

module.exports = { list, count, findById, create, update, remove, adjustStock, lowStock };
