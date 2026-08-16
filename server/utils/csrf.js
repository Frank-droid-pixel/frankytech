/**
 * FRANKY TECH — CSRF Protection (double-submit cookie pattern)
 * -----------------------------------------------------------
 * Since auth uses a same-site cookie (not a bearer token), state-
 * changing requests need CSRF protection independent of SameSite
 * alone. Pattern:
 *   1. On login/register, a random CSRF token is set in a
 *      readable (non-HttpOnly) cookie.
 *   2. The frontend echoes it back in an X-CSRF-Token header on
 *      every POST/PATCH/PUT/DELETE.
 *   3. The server rejects the request if the header doesn't
 *      match the cookie — a cross-site attacker can trigger a
 *      request with the cookie attached, but can't read the
 *      cookie's value to also set the header (browser same-
 *      origin policy).
 * Public routes (webhooks, share links, review submission) are
 * exempt since they have no session cookie to protect.
 * -----------------------------------------------------------
 */
const crypto = require('crypto');

const CSRF_COOKIE_NAME = 'franky_csrf';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const EXEMPT_PREFIXES = ['/api/public', '/api/auth/login', '/api/auth/register'];

function generateCsrfToken() {
  return crypto.randomBytes(24).toString('hex');
}

function buildCsrfCookieString(token) {
  const isProduction = process.env.NODE_ENV === 'production';
  const parts = [`${CSRF_COOKIE_NAME}=${token}`, 'Path=/', `Max-Age=${60 * 60 * 24 * 30}`, 'SameSite=Lax'];
  if (isProduction) parts.push('Secure');
  // Deliberately NOT HttpOnly — the frontend JS must be able to read
  // this value to echo it back in the header.
  return parts.join('; ');
}

function buildClearCsrfCookieString() {
  const isProduction = process.env.NODE_ENV === 'production';
  const parts = [`${CSRF_COOKIE_NAME}=`, 'Path=/', 'Max-Age=0', 'SameSite=Lax'];
  if (isProduction) parts.push('Secure');
  return parts.join('; ');
}

function setCsrfCookie(res, token) {
  res.setHeader('Set-Cookie', buildCsrfCookieString(token));
}

function verifyCsrf(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (EXEMPT_PREFIXES.some((p) => req.originalUrl.startsWith(p))) return next();
  // No session at all (guest hitting a protected route) — let auth
  // middleware reject it with a clearer 401 rather than a CSRF error.
  if (!req.session || !req.session.user) return next();

  const cookies = require('./cookies').parseCookies(req);
  const cookieToken = cookies[CSRF_COOKIE_NAME];
  const headerToken = req.header('x-csrf-token');

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    const { AppError } = require('../middleware/errorHandler');
    return next(new AppError('Invalid or missing CSRF token. Please refresh the page and try again.', 403));
  }
  next();
}

module.exports = { CSRF_COOKIE_NAME, generateCsrfToken, setCsrfCookie, buildCsrfCookieString, buildClearCsrfCookieString, verifyCsrf };
