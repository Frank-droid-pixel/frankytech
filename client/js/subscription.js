(function () {
  let businessId = null;
  const currentPlanBox = document.getElementById('currentPlanBox');
  const pricingGrid = document.getElementById('pricingGrid');

  function renderCurrent(sub, usage) {
    currentPlanBox.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <div style="font-size:var(--caption); color:var(--text-muted);">CURRENT PLAN</div>
          <div style="font-size:1.4rem; font-weight:700;">${sub.plan_name}</div>
        </div>
        <div style="text-align:right; font-size:var(--small); color:var(--text-muted);">
          <div>Invoices this month: ${usage.invoices_this_month}</div>
          <div>Team members: ${usage.team_members}</div>
        </div>
      </div>`;
  }

  function renderPlans(plans, currentCode) {
    pricingGrid.innerHTML = plans.map((p) => `
      <div class="price-card${p.code === currentCode ? ' featured' : ''}">
        <h3>${p.name}</h3>
        <div class="price">${p.price == 0 ? 'Free' : `$${p.price}<small>/${p.billing_interval}</small>`}</div>
        <ul>${p.features.map((f) => `<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>${f}</li>`).join('')}</ul>
        ${p.code === currentCode
          ? '<button class="btn btn-ghost btn-block" disabled>Current plan</button>'
          : `<button class="btn btn-primary btn-block" data-plan="${p.code}">Choose ${p.name}</button>`}
      </div>`).join('');

    pricingGrid.querySelectorAll('[data-plan]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          await FrankyAuth.api(`/api/subscriptions/change?businessId=${businessId}`, { method: 'POST', body: JSON.stringify({ planCode: btn.dataset.plan }) });
          window.frankyToast && window.frankyToast('✓ Plan updated');
          load();
        } catch (err) {
          alert(err.message);
          btn.disabled = false;
        }
      });
    });
  }

  async function load() {
    const [{ subscription, usage }, { plans }] = await Promise.all([
      FrankyAuth.api(`/api/subscriptions/current?businessId=${businessId}`),
      FrankyAuth.api('/api/subscriptions/plans'),
    ]);
    renderCurrent(subscription, usage);
    renderPlans(plans, subscription.plan_code);
  }

  (async function init() {
    const ctx = await AppShell.init('subscription.html');
    if (!ctx) return;
    businessId = ctx.businessId;
    load();
  })();
})();
