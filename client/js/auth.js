/**
 * FRANKY TECH — Shared Auth Helpers
 * -----------------------------------------------------------
 * Loaded on every protected/auth page. Small fetch wrapper +
 * page-guard helpers used by login.html, register.html,
 * onboarding.html and dashboard.html.
 * -----------------------------------------------------------
 */

const FrankyAuth = (function () {
  /**
   * Escapes user-supplied text before it's interpolated into innerHTML.
   * (Phase 25 — XSS protection.) Every page that renders customer names,
   * review comments, support messages, item names, etc. via innerHTML
   * MUST pass that value through this first — the server stores what
   * the user typed verbatim (correctly — that's not its job to guess
   * at), so escaping on display is where this has to happen.
   */
  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getCsrfToken() {
    const match = document.cookie.match(/(?:^|;\s*)franky_csrf=([^;]+)/);
    return match ? match[1] : null;
  }

  async function api(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };

    // CSRF (Phase 25): every state-changing request echoes back the
    // readable csrf cookie set at login/register — see server/utils/csrf.js.
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      const csrfToken = getCsrfToken();
      if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
    }

    const res = await fetch(path, {
      credentials: 'same-origin',
      headers,
      ...options,
    });
    let data = null;
    try { data = await res.json(); } catch (e) { data = null; }
    if (!res.ok) {
      const err = new Error((data && data.error && data.error.message) || 'Something went wrong.');
      err.details = data && data.error && data.error.details;
      err.status = res.status;
      throw err;
    }
    return data;
  }

  async function getSession() {
    return api('/api/auth/me');
  }

  /** Redirects to login.html if there is no active session. Returns the session data if authenticated. */
  async function requireSession() {
    const session = await getSession();
    if (!session.user) {
      window.location.href = '/login.html';
      return null;
    }
    return session;
  }

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login.html';
  }

  function setLoading(btn, isLoading) {
    if (!btn) return;
    btn.disabled = isLoading;
    btn.classList.toggle('loading', isLoading);
  }

  function showAlert(el, message, type = 'error') {
    if (!el) return;
    el.textContent = message;
    el.className = `form-alert show${type === 'success' ? ' success' : ''}`;
  }

  function hideAlert(el) {
    if (!el) return;
    el.className = 'form-alert';
  }

  function clearFieldErrors(form) {
    form.querySelectorAll('.field.has-error').forEach((f) => f.classList.remove('has-error'));
  }

  function applyFieldErrors(form, errors) {
    if (!errors) return;
    Object.keys(errors).forEach((name) => {
      const input = form.querySelector(`[name="${name}"]`);
      if (!input) return;
      const field = input.closest('.field');
      if (!field) return;
      field.classList.add('has-error');
      const errorEl = field.querySelector('.error');
      if (errorEl) errorEl.textContent = errors[name];
    });
  }

  return { api, getSession, requireSession, logout, setLoading, showAlert, hideAlert, clearFieldErrors, applyFieldErrors, escapeHtml };
})();
