const { query } = require('../config/db');

async function create({ businessId, userId, type, title, message, link }) {
  const { rows } = await query(
    `INSERT INTO notifications (business_id, user_id, type, title, message, link)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [businessId, userId || null, type, title, message || null, link || null]
  );
  return rows[0];
}

async function listForBusiness(businessId, { limit = 30 } = {}) {
  const { rows } = await query(
    'SELECT * FROM notifications WHERE business_id = $1 ORDER BY created_at DESC LIMIT $2',
    [businessId, limit]
  );
  return rows;
}

async function unreadCount(businessId) {
  const { rows } = await query('SELECT COUNT(*)::int AS n FROM notifications WHERE business_id = $1 AND is_read = false', [businessId]);
  return rows[0].n;
}

async function markRead(businessId, id) {
  const { rows } = await query('UPDATE notifications SET is_read = true WHERE business_id = $1 AND id = $2 RETURNING *', [businessId, id]);
  return rows[0] || null;
}

async function markAllRead(businessId) {
  await query('UPDATE notifications SET is_read = true WHERE business_id = $1 AND is_read = false', [businessId]);
}

/** Avoids spamming duplicate alerts (e.g. re-flagging the same low-stock item every dashboard load). */
async function existsRecentOfType(businessId, type, sinceHours = 24) {
  const { rows } = await query(
    `SELECT 1 FROM notifications WHERE business_id = $1 AND type = $2 AND created_at > now() - ($3 || ' hours')::interval LIMIT 1`,
    [businessId, type, String(sinceHours)]
  );
  return rows.length > 0;
}

module.exports = { create, listForBusiness, unreadCount, markRead, markAllRead, existsRecentOfType };
