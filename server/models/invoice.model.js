/**
 * FRANKY TECH — Invoice Model
 * -----------------------------------------------------------
 */

const { pool, query } = require('../config/db');

async function list(businessId, { status, customerId, limit = 50, offset = 0 } = {}) {
  const params = [businessId];
  let where = 'i.business_id = $1';
  if (status) {
    params.push(status);
    where += ` AND i.status = $${params.length}`;
  }
  if (customerId) {
    params.push(customerId);
    where += ` AND i.customer_id = $${params.length}`;
  }
  params.push(limit, offset);
  const { rows } = await query(
    `SELECT i.*, c.name AS customer_name, c.email AS customer_email
       FROM invoices i JOIN customers c ON c.id = i.customer_id
      WHERE ${where}
      ORDER BY i.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
}

async function count(businessId, status) {
  const params = [businessId];
  let where = 'business_id = $1';
  if (status) {
    params.push(status);
    where += ' AND status = $2';
  }
  const { rows } = await query(`SELECT COUNT(*)::int AS n FROM invoices WHERE ${where}`, params);
  return rows[0].n;
}

async function findById(businessId, id) {
  const { rows } = await query(
    `SELECT i.*, c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone, c.address AS customer_address
       FROM invoices i JOIN customers c ON c.id = i.customer_id
      WHERE i.business_id = $1 AND i.id = $2`,
    [businessId, id]
  );
  if (!rows[0]) return null;
  const itemsResult = await query('SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY sort_order ASC', [id]);
  return { ...rows[0], items: itemsResult.rows };
}

/**
 * Creates an invoice + line items inside one transaction, and — if any
 * line references a stock item — decrements stock and records an
 * inventory_transactions row in the SAME transaction, so invoice
 * creation and stock movement can never go out of sync.
 */
async function createWithItems({ businessId, customerId, invoiceNumber, currency, issueDate, dueDate, totals, notes, terms, userId }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const invResult = await client.query(
      `INSERT INTO invoices (
         business_id, customer_id, invoice_number, currency, issue_date, due_date,
         subtotal, discount_type, discount_value, discount_amount, tax_amount,
         shipping_amount, labour_amount, total, paid_amount, balance_amount, notes, terms
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING *`,
      [
        businessId, customerId, invoiceNumber, currency, issueDate, dueDate || null,
        totals.subtotal, totals.discountType, totals.discountValue, totals.discountAmount, totals.taxAmount,
        totals.shippingAmount, totals.labourAmount, totals.total, totals.paidAmount, totals.balanceAmount,
        notes || null, terms || null,
      ]
    );
    const invoice = invResult.rows[0];

    let sortOrder = 0;
    for (const line of totals.lines) {
      await client.query(
        `INSERT INTO invoice_items (invoice_id, item_id, description, quantity, unit_price, tax_rate, line_total, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [invoice.id, line.itemId || null, line.description, line.quantity, line.unitPrice, line.taxRate || 0, line.lineTotal, sortOrder]
      );
      sortOrder += 1;

      if (line.itemId) {
        await client.query(
          `UPDATE items SET quantity = quantity - $2, updated_at = now()
             WHERE id = $1 AND business_id = $3 AND type = 'product'`,
          [line.itemId, line.quantity, businessId]
        );
        await client.query(
          `INSERT INTO inventory_transactions (business_id, item_id, type, quantity, reference_type, reference_id, note, created_by)
           VALUES ($1,$2,'stock_out',$3,'invoice',$4,'Sold on invoice',$5)`,
          [businessId, line.itemId, line.quantity, invoice.id, userId || null]
        );
      }
    }

    await client.query('COMMIT');
    return findById(businessId, invoice.id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updateStatus(businessId, id, status) {
  const { rows } = await query(
    'UPDATE invoices SET status = $3, updated_at = now() WHERE business_id = $1 AND id = $2 RETURNING *',
    [businessId, id, status]
  );
  return rows[0] || null;
}

/** Applies a payment's effect on paid_amount/balance/status inside the same transaction as the payment. */
async function applyPaymentInTransaction(client, businessId, invoiceId, amount) {
  const { rows } = await client.query(
    `UPDATE invoices
        SET paid_amount = paid_amount + $3,
            balance_amount = GREATEST(0, total - (paid_amount + $3)),
            updated_at = now()
      WHERE business_id = $1 AND id = $2
      RETURNING *`,
    [businessId, invoiceId, amount]
  );
  return rows[0] || null;
}

async function markOverdueInvoices(businessId) {
  const { rows } = await query(
    `UPDATE invoices SET status = 'overdue', updated_at = now()
      WHERE business_id = $1 AND status IN ('sent', 'viewed', 'partially_paid')
        AND due_date IS NOT NULL AND due_date < CURRENT_DATE AND balance_amount > 0
      RETURNING id`,
    [businessId]
  );
  return rows.length;
}

module.exports = { list, count, findById, createWithItems, updateStatus, applyPaymentInTransaction, markOverdueInvoices };
