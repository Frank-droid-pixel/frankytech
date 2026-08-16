/**
 * FRANKY TECH — Auth Controller
 * -----------------------------------------------------------
 */

const authService = require('../services/auth.service');
const audit = require('../utils/audit');
const businessService = require('../services/business.service');
const { validateRegistration, validateLogin } = require('../validators/auth.validator');
const { setSessionCookie, clearSessionCookie, buildSessionCookieString, buildClearSessionCookieString, setCookies } = require('../utils/cookies');
const { generateCsrfToken, setCsrfCookie, buildCsrfCookieString, buildClearCsrfCookieString, CSRF_COOKIE_NAME } = require('../utils/csrf');
const { AppError } = require('../middleware/errorHandler');

function meta(req) {
  return { userAgent: req.headers['user-agent'], ipAddress: req.ip };
}

/** Sets both the session cookie and a fresh CSRF cookie in ONE Set-Cookie write. */
function establishSession(res, result) {
  const sessionCookie = buildSessionCookieString(result.rawToken, result.maxAgeSeconds);
  const csrfCookie = buildCsrfCookieString(generateCsrfToken());
  setCookies(res, [sessionCookie, csrfCookie]);
}

async function register(req, res, next) {
  try {
    const { valid, errors } = validateRegistration(req.body);
    if (!valid) throw new AppError('Please correct the highlighted fields.', 422, errors);

    const result = await authService.register(req.body, meta(req));
    establishSession(res, result);
    res.status(201).json({ user: result.user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { valid, errors } = validateLogin(req.body);
    if (!valid) throw new AppError('Please correct the highlighted fields.', 422, errors);

    const result = await authService.login(req.body, meta(req));
    establishSession(res, result);
    res.json({ user: result.user });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    if (req.session && req.session.user) {
      audit.log({ userId: req.session.user.id, action: 'user.logout', resource: 'users', ipAddress: req.ip });
    }
    await authService.logout(req.rawSessionToken);
    // Clear both cookies in one Set-Cookie write — see setCookies() doc.
    setCookies(res, [buildClearSessionCookieString(), buildClearCsrfCookieString()]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    if (!req.session || !req.session.user) {
      return res.json({ user: null, businesses: [], currentBusinessId: null });
    }
    const businesses = await businessService.listMyBusinesses(req.session.user.id);
    res.json({
      user: req.session.user,
      businesses,
      currentBusinessId: req.session.currentBusinessId || (businesses[0] && businesses[0].id) || null,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, me };
