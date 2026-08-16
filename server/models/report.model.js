/**
 * FRANKY TECH — Report Model
 * -----------------------------------------------------------
 * Read-only aggregate queries. Every number here comes straight
 * from the database — no invented statistics, per platform rules.
 * -----------------------------------------------------------
 */

const { query } = require('../config/db');

async function salesTotals(businessId, from, to) {
  const { rows } = await query(
    `SELECT COALESCE(SUM(total), 0)::float AS revenue, COUNT(*)::int AS invoice_count,
            COALESCE(SUM(paid_amount), 0)::float AS collected, COALESCE(SUM(balance_amount), 0)::float AS outstanding
       FROM invoices WHERE business_id = $1 AND status != 'cancelled' AND issue_date BETWEEN $2 AND $3`,
    [businessId, from, to]
  );
  return rows[0];
}

async function salesByDay(businessId, from, to) {
  const { rows } = await query(
    `SELECT issue_date::text AS date, COALESCE(SUM(total), 0)::float AS total
       FROM invoices WHERE business_id = $1 AND status != 'cancelled' AND issue_date BETWEEN $2 AND $3
      GROUP BY issue_date ORDER BY issue_date ASC`,
    [businessId, from, to]
  );
  return rows;
}

async function topProducts(businessId, from, to, limit = 5) {
  const { rows } = await query(
    `SELECT ii.description, SUM(ii.quantity)::float AS quantity_sold, SUM(ii.line_total)::float AS revenue
       FROM invoice_items ii
       JOIN invoices i ON i.id = ii.invoice_id
      WHERE i.business_id = $1 AND i.status != 'cancelled' AND i.issue_date BETWEEN $2 AND $3
      GROUP BY ii.description ORDER BY revenue DESC LIMIT $4`,
    [businessId, from, to, limit]
  );
  return rows;
}

async function invoiceStatusBreakdown(businessId) {
  const { rows } = await query(
    `SELECT status, COUNT(*)::int AS count, COALESCE(SUM(total), 0)::float AS total
       FROM invoices WHERE business_id = $1 GROUP BY status`,
    [businessId]
  );
  return rows;
}

async function customerCount(businessId) {
  const { rows } = await query('SELECT COUNT(*)::int AS n FROM customers WHERE business_id = $1', [businessId]);
  return rows[0].n;
}

async function newCustomersInPeriod(businessId, from, to) {
  const { rows } = await query(
    'SELECT COUNT(*)::int AS n FROM customers WHERE business_id = $1 AND created_at::date BETWEEN $2 AND $3',
    [businessId, from, to]
  );
  return rows[0].n;
}

module.exports = { salesTotals, salesByDay, topProducts, invoiceStatusBreakdown, customerCount, newCustomersInPeriod };
