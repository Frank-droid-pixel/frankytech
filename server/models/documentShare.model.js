/**
 * FRANKY TECH — Document Share Model (Customer Portal)
 * -----------------------------------------------------------
 * See migration 0003 note: this is how customers view their
 * own invoices/quotations/receipts without a separate login.
 * -----------------------------------------------------------
 */
const { query } = require('../config/db');

async function create({ businessId, docType, docId, token, expiresAt }) {
  const { rows } = await query(
    `INSERT INTO document_shares (business_id, doc_type, doc_id, token, expires_at)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [businessId, docType, docId, token, expiresAt || null]
  );
  return rows[0];
}

async function findValidByToken(token) {
  const { rows } = await query(
    `SELECT * FROM document_shares WHERE token = $1 AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now())`,
    [token]
  );
  return rows[0] || null;
}

async function findExistingActive(businessId, docType, docId) {
  const { rows } = await query(
    `SELECT * FROM document_shares WHERE business_id = $1 AND doc_type = $2 AND doc_id = $3
       AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now())
     ORDER BY created_at DESC LIMIT 1`,
    [businessId, docType, docId]
  );
  return rows[0] || null;
}

async function incrementViewCount(id) {
  await query('UPDATE document_shares SET view_count = view_count + 1 WHERE id = $1', [id]);
}

async function revoke(businessId, id) {
  const { rows } = await query(
    'UPDATE document_shares SET revoked_at = now() WHERE business_id = $1 AND id = $2 RETURNING *',
    [businessId, id]
  );
  return rows[0] || null;
}

module.exports = { create, findValidByToken, findExistingActive, incrementViewCount, revoke };
