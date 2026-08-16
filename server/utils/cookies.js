/**
 * FRANKY TECH — Minimal Cookie Helpers
 * -----------------------------------------------------------
 * Hand-rolled (no extra dependency) so Phase 1's dependency
 * list doesn't grow just for session cookies. Handles only
 * what FRANKY TECH needs: one HTTP-only session cookie.
 * -----------------------------------------------------------
 */

const SESSION_COOKIE_NAME = 'franky_session';

function parseCookies(req) {
  const header = req.headers.cookie;
  const out = {};
  if (!header) return out;
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  });
  return out;
}

function buildSessionCookieString(rawToken, maxAgeSeconds) {
  const isProduction = process.env.NODE_ENV === 'production';
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(rawToken)}`,
    'Path=/',
    'HttpOnly',
    `Max-Age=${maxAgeSeconds}`,
    'SameSite=Lax',
  ];
  if (isProduction) parts.push('Secure');
  return parts.join('; ');
}

function buildClearSessionCookieString() {
  const isProduction = process.env.NODE_ENV === 'production';
  const parts = [`${SESSION_COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'Max-Age=0', 'SameSite=Lax'];
  if (isProduction) parts.push('Secure');
  return parts.join('; ');
}

/**
 * Sets one or more cookies on the response in a single Set-Cookie
 * header write. res.setHeader('Set-Cookie', ...) REPLACES any prior
 * value rather than appending — calling it twice in a row silently
 * drops the first cookie. Always route multi-cookie writes through
 * this helper (array form) instead of calling setHeader repeatedly.
 */
function setCookies(res, cookieStrings) {
  res.setHeader('Set-Cookie', cookieStrings);
}

function setSessionCookie(res, rawToken, maxAgeSeconds) {
  setCookies(res, [buildSessionCookieString(rawToken, maxAgeSeconds)]);
}

function clearSessionCookie(res) {
  setCookies(res, [buildClearSessionCookieString()]);
}

module.exports = {
  SESSION_COOKIE_NAME,
  parseCookies,
  setSessionCookie,
  clearSessionCookie,
  buildSessionCookieString,
  buildClearSessionCookieString,
  setCookies,
};
