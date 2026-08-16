/**
 * FRANKY TECH — Auth Service
 * -----------------------------------------------------------
 * Business logic for registration, login, logout and session
 * resolution. Controllers stay thin; this is where the rules
 * live so they can be reused (e.g. by future admin tools).
 * -----------------------------------------------------------
 */

const userModel = require('../models/user.model');
const sessionModel = require('../models/session.model');
const referralService = require('./referral.service');
const audit = require('../utils/audit');
const { hashPassword, verifyPassword } = require('../utils/password');
const { generateRawToken, hashToken, generateReferralCode } = require('../utils/token');
const { AppError } = require('../middleware/errorHandler');

function toPublicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    phone: user.phone,
    country: user.country,
    referralCode: user.referral_code,
    emailVerified: !!user.email_verified_at,
    status: user.status,
    isPlatformAdmin: !!user.is_platform_admin,
  };
}

async function register({ fullName, email, phone, country, password, referralCode }, meta) {
  const existing = await userModel.findByEmail(email);
  if (existing) {
    throw new AppError('An account with this email already exists.', 409);
  }

  let referredBy = null;
  if (referralCode) {
    const referrer = await userModel.findByReferralCode(String(referralCode).trim().toUpperCase());
    if (referrer) referredBy = referrer.id;
  }

  const passwordHash = await hashPassword(password);
  const newReferralCode = generateReferralCode('FRANK');

  const user = await userModel.create({
    fullName: fullName.trim(),
    email,
    phone,
    country,
    passwordHash,
    referralCode: newReferralCode,
    referredBy,
  });

  // Referral attribution (Phase 17) — best-effort, never blocks registration.
  if (referredBy) referralService.attributeSignup(referredBy, user.id).catch(() => {});

  audit.log({ userId: user.id, action: 'user.register', resource: 'users', ipAddress: meta?.ipAddress });

  const session = await createSessionForUser(user.id, meta);
  return { user: toPublicUser(user), ...session };
}

async function login({ email, password }, meta) {
  const user = await userModel.findByEmail(email);
  if (!user) throw new AppError('Invalid email or password.', 401);

  if (user.status === 'suspended') {
    throw new AppError('This account has been suspended. Contact support for help.', 403);
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    audit.log({ userId: user.id, action: 'user.login_failed', resource: 'users', ipAddress: meta?.ipAddress });
    throw new AppError('Invalid email or password.', 401);
  }

  audit.log({ userId: user.id, action: 'user.login', resource: 'users', ipAddress: meta?.ipAddress });

  const session = await createSessionForUser(user.id, meta);
  return { user: toPublicUser(user), ...session };
}

async function createSessionForUser(userId, meta = {}) {
  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const session = await sessionModel.create({
    userId,
    tokenHash,
    userAgent: meta.userAgent,
    ipAddress: meta.ipAddress,
  });
  return { rawToken, sessionId: session.id, maxAgeSeconds: sessionModel.SESSION_TTL_SECONDS };
}

async function logout(rawToken) {
  if (!rawToken) return;
  await sessionModel.deleteByTokenHash(hashToken(rawToken));
}

async function resolveSession(rawToken) {
  if (!rawToken) return null;
  const session = await sessionModel.findValidByTokenHash(hashToken(rawToken));
  if (!session) return null;

  return {
    sessionId: session.id,
    currentBusinessId: session.current_business_id,
    user: toPublicUser({
      id: session.u_id,
      full_name: session.full_name,
      email: session.email,
      phone: session.phone,
      country: session.country,
      referral_code: session.referral_code,
      email_verified_at: session.email_verified_at,
      status: session.status,
      is_platform_admin: session.is_platform_admin,
    }),
  };
}

module.exports = { register, login, logout, resolveSession, toPublicUser };
