const { query } = require('../config/db');

async function recordClick(referralCode, ipAddress) {
  await query('INSERT INTO referral_clicks (referral_code, ip_address) VALUES ($1,$2)', [referralCode, ipAddress || null]);
}

async function clickCount(referralCode) {
  const { rows } = await query('SELECT COUNT(*)::int AS n FROM referral_clicks WHERE referral_code = $1', [referralCode]);
  return rows[0].n;
}

async function createReward({ referrerUserId, referredUserId }) {
  const { rows } = await query(
    `INSERT INTO referral_rewards (referrer_user_id, referred_user_id, status)
     VALUES ($1,$2,'pending') ON CONFLICT (referred_user_id) DO NOTHING RETURNING *`,
    [referrerUserId, referredUserId]
  );
  return rows[0] || null;
}

async function listForReferrer(referrerUserId) {
  const { rows } = await query(
    `SELECT rr.*, u.full_name AS referred_name, u.email AS referred_email, u.created_at AS referred_joined_at
       FROM referral_rewards rr JOIN users u ON u.id = rr.referred_user_id
      WHERE rr.referrer_user_id = $1 ORDER BY rr.created_at DESC`,
    [referrerUserId]
  );
  return rows;
}

async function statsForReferrer(referrerUserId) {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS registrations,
            COUNT(*) FILTER (WHERE status = 'qualified')::int AS active_referrals,
            COUNT(*) FILTER (WHERE status = 'paid')::int AS paying_referrals,
            COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0)::float AS pending_rewards,
            COALESCE(SUM(amount) FILTER (WHERE status = 'approved'), 0)::float AS approved_rewards,
            COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0)::float AS paid_rewards
       FROM referral_rewards WHERE referrer_user_id = $1`,
    [referrerUserId]
  );
  return rows[0];
}

module.exports = { recordClick, clickCount, createReward, listForReferrer, statsForReferrer };
