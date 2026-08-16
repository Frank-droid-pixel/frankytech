/**
 * FRANKY TECH — Document Sequence Model
 * -----------------------------------------------------------
 * Generates gapless, per-business document numbers (e.g.
 * INV-2026-000001) inside a row-locking transaction so two
 * simultaneous invoice creations never collide.
 * -----------------------------------------------------------
 */

const { pool } = require('../config/db');

async function nextNumber(client, businessId, docType, prefix) {
  const year = new Date().getFullYear();

  const result = await client.query(
    `UPDATE document_sequences
        SET next_number = next_number + 1, updated_at = now()
      WHERE business_id = $1 AND doc_type = $2
      RETURNING next_number - 1 AS used_number, prefix`,
    [businessId, docType]
  );

  const used = result.rows[0];
  const num = String(used.used_number).padStart(6, '0');
  return `${used.prefix || prefix || ''}-${year}-${num}`;
}

async function ensureSequenceExists(client, businessId, docType, prefix) {
  await client.query(
    `INSERT INTO document_sequences (business_id, doc_type, prefix, next_number)
     VALUES ($1, $2, $3, 1)
     ON CONFLICT (business_id, doc_type) DO NOTHING`,
    [businessId, docType, prefix || '']
  );
}

/** Public helper: generates the next document number inside its own transaction. */
async function generate(businessId, docType, prefix) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await ensureSequenceExists(client, businessId, docType, prefix);
    const number = await nextNumber(client, businessId, docType, prefix);
    await client.query('COMMIT');
    return number;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { generate };
