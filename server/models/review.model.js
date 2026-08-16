const { query } = require('../config/db');

async function createRequest({ businessId, customerId, invoiceId, token }) {
  const { rows } = await query(
    `INSERT INTO review_requests (business_id, customer_id, invoice_id, token) VALUES ($1,$2,$3,$4) RETURNING *`,
    [businessId, customerId, invoiceId || null, token]
  );
  return rows[0];
}

async function findRequestByToken(token) {
  const { rows } = await query(
    `SELECT rr.*, c.name AS customer_name, b.name AS business_name, b.id AS business_id
       FROM review_requests rr
       JOIN customers c ON c.id = rr.customer_id
       JOIN businesses b ON b.id = rr.business_id
      WHERE rr.token = $1`,
    [token]
  );
  return rows[0] || null;
}

async function markRequestSubmitted(id) {
  await query('UPDATE review_requests SET submitted_at = now() WHERE id = $1', [id]);
}

async function create({ businessId, customerId, invoiceId, rating, comment, reviewerName, isVerified }) {
  const { rows } = await query(
    `INSERT INTO reviews (business_id, customer_id, invoice_id, rating, comment, reviewer_name, is_verified, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'pending') RETURNING *`,
    [businessId, customerId || null, invoiceId || null, rating, comment || null, reviewerName, !!isVerified]
  );
  return rows[0];
}

async function listForBusiness(businessId, { status, sort = 'newest', limit = 50, offset = 0 } = {}) {
  const params = [businessId];
  let where = 'business_id = $1';
  if (status) {
    params.push(status);
    where += ` AND status = $${params.length}`;
  }
  const orderMap = {
    newest: 'created_at DESC',
    highest: 'rating DESC, created_at DESC',
    lowest: 'rating ASC, created_at DESC',
    verified: 'is_verified DESC, created_at DESC',
  };
  params.push(limit, offset);
  const { rows } = await query(
    `SELECT * FROM reviews WHERE ${where} ORDER BY ${orderMap[sort] || orderMap.newest} LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
}

async function publicListForBusiness(businessId) {
  const { rows } = await query(
    `SELECT id, rating, comment, reviewer_name, is_verified, business_response, business_response_at, created_at
       FROM reviews WHERE business_id = $1 AND status = 'approved' ORDER BY created_at DESC`,
    [businessId]
  );
  return rows;
}

async function summary(businessId) {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS total, COALESCE(AVG(rating), 0)::float AS average,
            COUNT(*) FILTER (WHERE rating = 5)::int AS r5, COUNT(*) FILTER (WHERE rating = 4)::int AS r4,
            COUNT(*) FILTER (WHERE rating = 3)::int AS r3, COUNT(*) FILTER (WHERE rating = 2)::int AS r2,
            COUNT(*) FILTER (WHERE rating = 1)::int AS r1
       FROM reviews WHERE business_id = $1 AND status = 'approved'`,
    [businessId]
  );
  return rows[0];
}

async function findById(businessId, id) {
  const { rows } = await query('SELECT * FROM reviews WHERE business_id = $1 AND id = $2', [businessId, id]);
  return rows[0] || null;
}

async function updateStatus(businessId, id, status) {
  const { rows } = await query('UPDATE reviews SET status = $3 WHERE business_id = $1 AND id = $2 RETURNING *', [businessId, id, status]);
  return rows[0] || null;
}

async function respond(businessId, id, response) {
  const { rows } = await query(
    'UPDATE reviews SET business_response = $3, business_response_at = now() WHERE business_id = $1 AND id = $2 RETURNING *',
    [businessId, id, response]
  );
  return rows[0] || null;
}

async function reportReview(reviewId, reason, details) {
  const { rows } = await query(
    'INSERT INTO review_reports (review_id, reason, details) VALUES ($1,$2,$3) RETURNING *',
    [reviewId, reason, details || null]
  );
  return rows[0];
}

module.exports = {
  createRequest, findRequestByToken, markRequestSubmitted, create, listForBusiness,
  publicListForBusiness, summary, findById, updateStatus, respond, reportReview,
};
