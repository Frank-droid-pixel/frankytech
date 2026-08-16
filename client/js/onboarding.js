/**
 * FRANKY TECH — Onboarding Wizard
 * -----------------------------------------------------------
 * Step 1 (business name) creates the business record right
 * away via POST /api/businesses, so nothing is lost if the
 * user abandons the wizard partway through. Steps 2-4 PATCH
 * the same business and mark onboarding complete on the
 * final step.
 * -----------------------------------------------------------
 */
(function () {
  const TOTAL_STEPS = 4;
  let currentStep = 1;
  let businessId = null;

  const form = document.getElementById('onboardingForm');
  const alertEl = document.getElementById('formAlert');
  const nextBtn = document.getElementById('nextBtn');
  const backBtn = document.getElementById('backBtn');
  const stepNum = document.getElementById('stepNum');
  const progressBar = document.getElementById('progressBar');
  const logoutBtn = document.getElementById('logoutBtn');

  logoutBtn.addEventListener('click', () => FrankyAuth.logout());

  function showStep(n) {
    form.querySelectorAll('.wizard-step').forEach((el) => {
      el.classList.toggle('active', Number(el.dataset.step) === n);
    });
    stepNum.textContent = n;
    progressBar.style.width = `${(n / TOTAL_STEPS) * 100}%`;
    backBtn.style.visibility = n === 1 ? 'hidden' : 'visible';
    nextBtn.querySelector('.btn-label').textContent = n === TOTAL_STEPS ? 'Finish setup' : 'Continue';
  }

  function fieldsForStep(n) {
    const map = {
      1: ['name', 'businessType'],
      2: ['phone', 'email', 'address', 'country'],
      3: ['currency', 'taxId'],
      4: ['invoicePrefix', 'invoiceTerms', 'invoiceFooter'],
    };
    return map[n];
  }

  function collect(names) {
    const data = new FormData(form);
    const out = {};
    names.forEach((n) => { out[n] = data.get(n) || ''; });
    return out;
  }

  async function ensureExistingBusiness() {
    // If the user already has a business (e.g. re-opened this page),
    // reuse it instead of creating a duplicate.
    const session = await FrankyAuth.getSession();
    if (session.businesses && session.businesses.length > 0) {
      businessId = session.businesses[0].id;
      return session.businesses[0];
    }
    return null;
  }

  async function handleStep1() {
    const { name, businessType } = collect(['name', 'businessType']);
    if (!name || name.trim().length < 2) {
      FrankyAuth.showAlert(alertEl, 'Business name must be at least 2 characters.');
      return false;
    }
    const existing = await ensureExistingBusiness();
    if (existing) {
      await FrankyAuth.api(`/api/businesses/${businessId}/onboarding`, {
        method: 'PATCH',
        body: JSON.stringify({ name, business_type: businessType }),
      });
    } else {
      const { business } = await FrankyAuth.api('/api/businesses', {
        method: 'POST',
        body: JSON.stringify({ name, businessType }),
      });
      businessId = business.id;
    }
    return true;
  }

  async function patchBusiness(fields) {
    await FrankyAuth.api(`/api/businesses/${businessId}/onboarding`, {
      method: 'PATCH',
      body: JSON.stringify(fields),
    });
  }

  async function advance() {
    FrankyAuth.hideAlert(alertEl);
    FrankyAuth.setLoading(nextBtn, true);
    try {
      if (currentStep === 1) {
        const ok = await handleStep1();
        if (!ok) return;
      } else if (currentStep === 2) {
        const { phone, email, address, country } = collect(['phone', 'email', 'address', 'country']);
        await patchBusiness({ phone, email, address, country });
      } else if (currentStep === 3) {
        const { currency, taxId } = collect(['currency', 'taxId']);
        await patchBusiness({ currency, tax_id: taxId });
      } else if (currentStep === 4) {
        const { invoicePrefix, invoiceTerms, invoiceFooter } = collect(['invoicePrefix', 'invoiceTerms', 'invoiceFooter']);
        await patchBusiness({
          invoice_prefix: invoicePrefix || 'INV',
          invoice_terms: invoiceTerms,
          invoice_footer: invoiceFooter,
        });
        window.frankyToast && window.frankyToast('✓ Business set up complete');
        window.location.href = '/dashboard.html';
        return;
      }

      currentStep = Math.min(currentStep + 1, TOTAL_STEPS);
      showStep(currentStep);
    } catch (err) {
      FrankyAuth.showAlert(alertEl, err.message);
    } finally {
      FrankyAuth.setLoading(nextBtn, false);
    }
  }

  nextBtn.addEventListener('click', advance);
  backBtn.addEventListener('click', () => {
    currentStep = Math.max(currentStep - 1, 1);
    showStep(currentStep);
  });

  (async function init() {
    const session = await FrankyAuth.requireSession();
    if (!session) return;
    if (session.businesses && session.businesses.length > 0 && session.businesses[0].onboarding_completed_at) {
      window.location.href = '/dashboard.html';
      return;
    }
    showStep(1);
  })();
})();
