/**
 * FRANKY TECH — Session Model
 * -----------------------------------------------------------
 */

const { query } = require('../config/db');

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

async function create({ userId, tokenHash, userAgent, ipAddress }) {
  const { rows } = await query(
    `INSERT INTO sessions (user_id, token_hash, user_agent, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, now() + interval '30 days')
     RETURNING id, user_id, current_business_id, expires_at`,
    [userId, tokenHash, userAgent || null, ipAddress || null]
  );
  return rows[0];
}

async function findValidByTokenHash(tokenHash) {
  const { rows } = await query(
    `SELECT s.*, u.id AS u_id, u.full_name, u.email, u.phone, u.country,
            u.referral_code, u.email_verified_at, u.status, u.is_platform_admin
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [tokenHash]
  );
  return rows[0] || null;
}

async function deleteByTokenHash(tokenHash) {
  await query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash]);
}

async function setCurrentBusiness(sessionId, businessId) {
  await query('UPDATE sessions SET current_business_id = $2 WHERE id = $1', [sessionId, businessId]);
}

module.exports = {
  SESSION_TTL_SECONDS,
  create,
  findValidByTokenHash,
  deleteByTokenHash,
  setCurrentBusiness,
};
