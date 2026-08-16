/**
 * FRANKY TECH — Register Page Logic
 * (Extracted from an inline <script> block — see login.js for why.)
 */
(function () {
  const form = document.getElementById('registerForm');
  const alertEl = document.getElementById('formAlert');
  const submitBtn = document.getElementById('submitBtn');

  // Referral attribution (Phase 17): if this page was opened via
  // /register.html?ref=CODE, prefill the field and log the click.
  const refCode = new URLSearchParams(window.location.search).get('ref');
  if (refCode) {
    const refInput = document.getElementById('referralCode');
    if (refInput) refInput.value = refCode;
    fetch(`/api/public/referrals/click/${encodeURIComponent(refCode)}`).catch(() => {});
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    FrankyAuth.hideAlert(alertEl);
    FrankyAuth.clearFieldErrors(form);
    FrankyAuth.setLoading(submitBtn, true);

    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      await FrankyAuth.api('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
      window.location.href = '/onboarding.html';
    } catch (err) {
      FrankyAuth.showAlert(alertEl, err.message);
      FrankyAuth.applyFieldErrors(form, err.details);
    } finally {
      FrankyAuth.setLoading(submitBtn, false);
    }
  });
})();
