/**
 * FRANKY TECH — User Model
 * -----------------------------------------------------------
 * Raw parameterized SQL. No ORM in Phase 1–5; a mature
 * query layer (e.g. Prisma) can replace this later without
 * changing the service/controller layers above it.
 * -----------------------------------------------------------
 */

const { query } = require('../config/db');

const PUBLIC_COLUMNS = `
  id, full_name, email, phone, country, referral_code,
  referred_by, email_verified_at, status, is_platform_admin, created_at, updated_at
`;

async function findByEmail(email) {
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function create({ fullName, email, phone, country, passwordHash, referralCode, referredBy }) {
  const { rows } = await query(
    `INSERT INTO users (full_name, email, phone, country, password_hash, referral_code, referred_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${PUBLIC_COLUMNS}`,
    [fullName, email.toLowerCase().trim(), phone || null, country || null, passwordHash, referralCode, referredBy || null]
  );
  return rows[0];
}

async function findByReferralCode(code) {
  const { rows } = await query('SELECT id, full_name, referral_code FROM users WHERE referral_code = $1', [code]);
  return rows[0] || null;
}

async function updatePassword(userId, passwordHash) {
  await query('UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2', [passwordHash, userId]);
}

async function markEmailVerified(userId) {
  await query('UPDATE users SET email_verified_at = now(), updated_at = now() WHERE id = $1', [userId]);
}

async function updateProfile(userId, { fullName, phone, country }) {
  const { rows } = await query(
    `UPDATE users SET full_name = COALESCE($2, full_name), phone = COALESCE($3, phone),
       country = COALESCE($4, country), updated_at = now()
     WHERE id = $1 RETURNING ${PUBLIC_COLUMNS}`,
    [userId, fullName || null, phone || null, country || null]
  );
  return rows[0];
}

module.exports = {
  findByEmail,
  findById,
  create,
  findByReferralCode,
  updatePassword,
  markEmailVerified,
  updateProfile,
};
