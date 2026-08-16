/**
 * FRANKY TECH — Inventory Transaction Model
 * -----------------------------------------------------------
 */

const { query } = require('../config/db');

async function record(client, { businessId, itemId, type, quantity, referenceType, referenceId, note, createdBy }) {
  const executor = client || { query };
  const { rows } = await executor.query(
    `INSERT INTO inventory_transactions (business_id, item_id, type, quantity, reference_type, reference_id, note, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [businessId, itemId, type, quantity, referenceType || null, referenceId || null, note || null, createdBy || null]
  );
  return rows[0];
}

async function historyForItem(businessId, itemId, limit = 50) {
  const { rows } = await query(
    `SELECT * FROM inventory_transactions WHERE business_id = $1 AND item_id = $2 ORDER BY created_at DESC LIMIT $3`,
    [businessId, itemId, limit]
  );
  return rows;
}

module.exports = { record, historyForItem };
