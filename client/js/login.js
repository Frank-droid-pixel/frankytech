/**
 * FRANKY TECH — Login Page Logic
 * (Extracted from an inline <script> block so it runs under a strict
 * Content-Security-Policy that disallows inline scripts — see
 * server/middleware/security.js.)
 */
(function () {
  const form = document.getElementById('loginForm');
  const alertEl = document.getElementById('formAlert');
  const submitBtn = document.getElementById('submitBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    FrankyAuth.hideAlert(alertEl);
    FrankyAuth.clearFieldErrors(form);
    FrankyAuth.setLoading(submitBtn, true);

    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      await FrankyAuth.api('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) });
      const session = await FrankyAuth.getSession();
      if (session.businesses && session.businesses.length > 0) {
        window.location.href = '/dashboard.html';
      } else {
        window.location.href = '/onboarding.html';
      }
    } catch (err) {
      FrankyAuth.showAlert(alertEl, err.message);
      FrankyAuth.applyFieldErrors(form, err.details);
    } finally {
      FrankyAuth.setLoading(submitBtn, false);
    }
  });
})();
