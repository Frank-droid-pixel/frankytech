/**
 * FRANKY TECH — Quotation Model
 * -----------------------------------------------------------
 */

const { pool, query } = require('../config/db');

async function list(businessId, { status, limit = 50, offset = 0 } = {}) {
  const params = [businessId];
  let where = 'q.business_id = $1';
  if (status) {
    params.push(status);
    where += ` AND q.status = $${params.length}`;
  }
  params.push(limit, offset);
  const { rows } = await query(
    `SELECT q.*, c.name AS customer_name, c.email AS customer_email
       FROM quotations q JOIN customers c ON c.id = q.customer_id
      WHERE ${where}
      ORDER BY q.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
}

async function count(businessId) {
  const { rows } = await query('SELECT COUNT(*)::int AS n FROM quotations WHERE business_id = $1', [businessId]);
  return rows[0].n;
}

async function findById(businessId, id) {
  const { rows } = await query(
    `SELECT q.*, c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone, c.address AS customer_address
       FROM quotations q JOIN customers c ON c.id = q.customer_id
      WHERE q.business_id = $1 AND q.id = $2`,
    [businessId, id]
  );
  if (!rows[0]) return null;
  const itemsResult = await query('SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY sort_order ASC', [id]);
  return { ...rows[0], items: itemsResult.rows };
}

async function createWithItems({ businessId, customerId, quotationNumber, currency, issueDate, validUntil, totals, notes, terms }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO quotations (
         business_id, customer_id, quotation_number, currency, issue_date, valid_until,
         subtotal, discount_type, discount_value, discount_amount, tax_amount,
         shipping_amount, labour_amount, total, notes, terms
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        businessId, customerId, quotationNumber, currency, issueDate, validUntil || null,
        totals.subtotal, totals.discountType, totals.discountValue, totals.discountAmount,
        totals.taxAmount, totals.shippingAmount, totals.labourAmount, totals.total, notes || null, terms || null,
      ]
    );
    const quotation = result.rows[0];

    let sortOrder = 0;
    for (const line of totals.lines) {
      await client.query(
        `INSERT INTO quotation_items (quotation_id, item_id, description, quantity, unit_price, tax_rate, line_total, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [quotation.id, line.itemId || null, line.description, line.quantity, line.unitPrice, line.taxRate || 0, line.lineTotal, sortOrder]
      );
      sortOrder += 1;
    }

    await client.query('COMMIT');
    return findById(businessId, quotation.id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updateStatus(businessId, id, status, convertedInvoiceId) {
  const { rows } = await query(
    `UPDATE quotations SET status = $3, converted_invoice_id = COALESCE($4, converted_invoice_id), updated_at = now()
      WHERE business_id = $1 AND id = $2 RETURNING *`,
    [businessId, id, status, convertedInvoiceId || null]
  );
  return rows[0] || null;
}

module.exports = { list, count, findById, createWithItems, updateStatus };
