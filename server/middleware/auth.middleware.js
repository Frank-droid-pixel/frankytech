/**
 * FRANKY TECH — Auth Middleware
 * -----------------------------------------------------------
 * requireAuth   — rejects the request unless the session cookie
 *                 resolves to a valid, non-expired session.
 * attachSession — resolves the session if present but does NOT
 *                 reject the request (used for pages/endpoints
 *                 that behave differently for guests vs. users).
 * requireBusiness — ensures req.business is set and the user
 *                 is actually a member (data isolation boundary).
 * -----------------------------------------------------------
 */

const authService = require('../services/auth.service');
const businessService = require('../services/business.service');
const { parseCookies, SESSION_COOKIE_NAME } = require('../utils/cookies');
const { AppError } = require('./errorHandler');

async function attachSession(req, res, next) {
  try {
    const cookies = parseCookies(req);
    const rawToken = cookies[SESSION_COOKIE_NAME];
    const resolved = await authService.resolveSession(rawToken);
    req.session = resolved; // null if not logged in
    req.rawSessionToken = rawToken || null;
    next();
  } catch (err) {
    next(err);
  }
}

function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return next(new AppError('Authentication required.', 401));
  }
  next();
}

async function requireBusiness(req, res, next) {
  try {
    const businessId = req.header('x-business-id') || req.query.businessId || req.session.currentBusinessId;
    const { business, role } = await businessService.getOwnedBusinessOrThrow(businessId, req.session.user.id);
    req.business = business;
    req.businessRole = role;
    next();
  } catch (err) {
    next(err);
  }
}

/** Gate for actions only certain business roles may perform (e.g. inviting team members, changing plans). */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.businessRole)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
}

/** Gate for platform-admin-only routes (Phase 24) — completely separate from business roles. */
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user || !req.session.user.isPlatformAdmin) {
    return next(new AppError('Admin access required.', 403));
  }
  next();
}

module.exports = { attachSession, requireAuth, requireBusiness, requireRole, requireAdmin };
