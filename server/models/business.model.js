/**
 * FRANKY TECH — Business Model
 * -----------------------------------------------------------
 */

const { query } = require('../config/db');

async function create({ ownerId, name, slug, businessType, country, currency }) {
  const { rows } = await query(
    `INSERT INTO businesses (owner_id, name, slug, business_type, country, currency)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [ownerId, name, slug, businessType || null, country || null, currency || 'USD']
  );
  return rows[0];
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM businesses WHERE id = $1', [id]);
  return rows[0] || null;
}

async function listForUser(userId) {
  const { rows } = await query(
    `SELECT b.*, bm.role
       FROM businesses b
       JOIN business_members bm ON bm.business_id = b.id
      WHERE bm.user_id = $1
      ORDER BY b.created_at ASC`,
    [userId]
  );
  return rows;
}

async function addMember({ businessId, userId, role }) {
  await query(
    `INSERT INTO business_members (business_id, user_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (business_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
    [businessId, userId, role || 'owner']
  );
}

async function getMembership(businessId, userId) {
  const { rows } = await query(
    'SELECT * FROM business_members WHERE business_id = $1 AND user_id = $2',
    [businessId, userId]
  );
  return rows[0] || null;
}

async function updateProfile(businessId, fields) {
  const allowed = [
    'name', 'business_type', 'logo_url', 'description', 'address', 'phone',
    'email', 'website', 'country', 'currency', 'tax_id', 'tax_rate',
    'invoice_prefix', 'invoice_terms', 'invoice_footer',
  ];
  const sets = [];
  const values = [businessId];
  let i = 2;

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      sets.push(`${key} = $${i}`);
      values.push(fields[key]);
      i += 1;
    }
  }

  if (sets.length === 0) return findById(businessId);

  const { rows } = await query(
    `UPDATE businesses SET ${sets.join(', ')}, updated_at = now() WHERE id = $1 RETURNING *`,
    values
  );
  return rows[0];
}

async function markOnboardingComplete(businessId) {
  const { rows } = await query(
    'UPDATE businesses SET onboarding_completed_at = now(), updated_at = now() WHERE id = $1 RETURNING *',
    [businessId]
  );
  return rows[0];
}

module.exports = {
  create,
  findById,
  listForUser,
  addMember,
  getMembership,
  updateProfile,
  markOnboardingComplete,
};
