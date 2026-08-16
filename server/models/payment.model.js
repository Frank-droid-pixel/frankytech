/**
 * FRANKY TECH — Payment + Receipt Model
 * -----------------------------------------------------------
 * A payment always creates its receipt in the SAME database
 * transaction, and always updates the invoice's paid/balance
 * amounts in that same transaction — this is the one place
 * money is recorded, so it can never partially apply.
 * -----------------------------------------------------------
 */

const { pool, query } = require('../config/db');
const invoiceModel = require('./invoice.model');
const sequenceModel = require('./documentSequence.model');
const { deriveInvoiceStatus } = require('../services/finance.service');

async function recordPaymentAndReceipt({ businessId, invoiceId, amount, currency, method, reference, notes, invoicePrefix }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const paymentResult = await client.query(
      `INSERT INTO payments (business_id, invoice_id, amount, currency, method, reference, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [businessId, invoiceId, amount, currency, method, reference || null, notes || null]
    );
    const payment = paymentResult.rows[0];

    const invoiceRow = await invoiceModel.applyPaymentInTransaction(client, businessId, invoiceId, amount);
    if (!invoiceRow) throw new Error('Invoice not found for this business.');

    const totals = {
      total: Number(invoiceRow.total),
      paidAmount: Number(invoiceRow.paid_amount),
      balanceAmount: Number(invoiceRow.balance_amount),
    };
    const newStatus = deriveInvoiceStatus(totals, invoiceRow.status, invoiceRow.due_date);
    await client.query('UPDATE invoices SET status = $3 WHERE business_id = $1 AND id = $2', [businessId, invoiceId, newStatus]);

    await client.query(
      `INSERT INTO document_sequences (business_id, doc_type, prefix, next_number)
       VALUES ($1, 'receipt', $2, 1)
       ON CONFLICT (business_id, doc_type) DO NOTHING`,
      [businessId, invoicePrefix ? `REC-${invoicePrefix}` : 'REC']
    );
    const seqResult = await client.query(
      `UPDATE document_sequences SET next_number = next_number + 1, updated_at = now()
        WHERE business_id = $1 AND doc_type = 'receipt'
        RETURNING next_number - 1 AS used_number, prefix`,
      [businessId]
    );
    const year = new Date().getFullYear();
    const receiptNumber = `${seqResult.rows[0].prefix}-${year}-${String(seqResult.rows[0].used_number).padStart(6, '0')}`;

    const receiptResult = await client.query(
      `INSERT INTO receipts (business_id, payment_id, invoice_id, customer_id, receipt_number, amount, balance_after)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [businessId, payment.id, invoiceId, invoiceRow.customer_id, receiptNumber, amount, invoiceRow.balance_amount]
    );

    await client.query('COMMIT');
    return { payment, receipt: receiptResult.rows[0], invoice: { ...invoiceRow, status: newStatus } };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listForInvoice(businessId, invoiceId) {
  const { rows } = await query(
    'SELECT * FROM payments WHERE business_id = $1 AND invoice_id = $2 ORDER BY paid_at DESC',
    [businessId, invoiceId]
  );
  return rows;
}

async function listReceipts(businessId, { limit = 50, offset = 0 } = {}) {
  const { rows } = await query(
    `SELECT r.*, c.name AS customer_name, i.invoice_number
       FROM receipts r
       JOIN customers c ON c.id = r.customer_id
       JOIN invoices i ON i.id = r.invoice_id
      WHERE r.business_id = $1
      ORDER BY r.created_at DESC LIMIT $2 OFFSET $3`,
    [businessId, limit, offset]
  );
  return rows;
}

async function findReceiptById(businessId, id) {
  const { rows } = await query(
    `SELECT r.*, c.name AS customer_name, c.email AS customer_email, i.invoice_number, p.method
       FROM receipts r
       JOIN customers c ON c.id = r.customer_id
       JOIN invoices i ON i.id = r.invoice_id
       JOIN payments p ON p.id = r.payment_id
      WHERE r.business_id = $1 AND r.id = $2`,
    [businessId, id]
  );
  return rows[0] || null;
}

module.exports = { recordPaymentAndReceipt, listForInvoice, listReceipts, findReceiptById };
