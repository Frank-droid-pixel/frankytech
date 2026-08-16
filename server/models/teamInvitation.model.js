const { query } = require('../config/db');

async function create({ businessId, email, role, token, invitedBy }) {
  const { rows } = await query(
    `INSERT INTO team_invitations (business_id, email, role, token, invited_by) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [businessId, email.toLowerCase().trim(), role, token, invitedBy]
  );
  return rows[0];
}

async function listForBusiness(businessId) {
  const { rows } = await query('SELECT * FROM team_invitations WHERE business_id = $1 ORDER BY created_at DESC', [businessId]);
  return rows;
}

async function findValidByToken(token) {
  const { rows } = await query(
    `SELECT * FROM team_invitations WHERE token = $1 AND status = 'pending' AND expires_at > now()`,
    [token]
  );
  return rows[0] || null;
}

async function markAccepted(id) {
  const { rows } = await query(`UPDATE team_invitations SET status = 'accepted' WHERE id = $1 RETURNING *`, [id]);
  return rows[0] || null;
}

async function revoke(businessId, id) {
  const { rows } = await query(`UPDATE team_invitations SET status = 'revoked' WHERE business_id = $1 AND id = $2 RETURNING *`, [businessId, id]);
  return rows[0] || null;
}

async function membersForBusiness(businessId) {
  const { rows } = await query(
    `SELECT bm.id AS membership_id, bm.role, bm.created_at AS joined_at, u.id AS user_id, u.full_name, u.email
       FROM business_members bm JOIN users u ON u.id = bm.user_id
      WHERE bm.business_id = $1 ORDER BY bm.created_at ASC`,
    [businessId]
  );
  return rows;
}

async function updateMemberRole(businessId, membershipId, role) {
  const { rows } = await query(
    `UPDATE business_members SET role = $3 WHERE business_id = $1 AND id = $2 AND role != 'owner' RETURNING *`,
    [businessId, membershipId, role]
  );
  return rows[0] || null;
}

async function removeMember(businessId, membershipId) {
  const { rowCount } = await query(
    `DELETE FROM business_members WHERE business_id = $1 AND id = $2 AND role != 'owner'`,
    [businessId, membershipId]
  );
  return rowCount > 0;
}

module.exports = { create, listForBusiness, findValidByToken, markAccepted, revoke, membersForBusiness, updateMemberRole, removeMember };
