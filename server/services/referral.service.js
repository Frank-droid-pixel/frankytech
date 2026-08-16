/**
 * FRANKY TECH — Referral Service (Phase 17)
 * -----------------------------------------------------------
 * Anti-fraud (per spec §52): a referral only ever counts once
 * per referred user (DB unique constraint), and self-referral
 * is blocked by refusing to create a reward where referrer and
 * referred are the same user.
 * -----------------------------------------------------------
 */
const referralModel = require('../models/referral.model');
const userModel = require('../models/user.model');

async function recordClick(code, ipAddress) {
  if (!code) return;
  await referralModel.recordClick(code, ipAddress);
}

/** Called right after a new user registers with a referral code. */
async function attributeSignup(referrerUserId, referredUserId) {
  if (!referrerUserId || referrerUserId === referredUserId) return null; // blocks self-referral
  return referralModel.createReward({ referrerUserId, referredUserId });
}

/** Called when a referred user completes onboarding (creates their first business) — the "qualifying" event. */
async function qualifyReferral(referredUserId) {
  const { pool } = require('../config/db');
  await pool.query(
    `UPDATE referral_rewards SET status = 'qualified' WHERE referred_user_id = $1 AND status = 'pending'`,
    [referredUserId]
  );
}

async function dashboardData(user) {
  const [stats, history, clicks] = await Promise.all([
    referralModel.statsForReferrer(user.id),
    referralModel.listForReferrer(user.id),
    referralModel.clickCount(user.referralCode),
  ]);
  return {
    referralCode: user.referralCode,
    referralUrl: `${process.env.APP_URL || ''}/register.html?ref=${user.referralCode}`,
    stats: { ...stats, clicks },
    history,
  };
}

module.exports = { recordClick, attributeSignup, qualifyReferral, dashboardData };
