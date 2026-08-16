/**
 * FRANKY TECH — Token Utilities
 * -----------------------------------------------------------
 * Random tokens for sessions, password resets and email
 * verification, plus referral code generation.
 * -----------------------------------------------------------
 */

const crypto = require('crypto');

function generateRawToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function generateReferralCode(prefix = 'FRANK') {
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix.toUpperCase()}${random}`;
}

module.exports = { generateRawToken, hashToken, generateReferralCode };
