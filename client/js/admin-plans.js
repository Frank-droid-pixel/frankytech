(function () {
  const plansList = document.getElementById('plansList');

  function render(plans) {
    plansList.innerHTML = plans.map((p) => `
      <div class="dash-panel" style="margin-bottom:16px; max-width:600px;">
        <div class="field-row">
          <div class="field"><label>Name</label><input type="text" data-field="name" data-id="${p.id}" value="${p.name}"></div>
          <div class="field"><label>Price</label><input type="number" step="0.01" data-field="price" data-id="${p.id}" value="${p.price}"></div>
        </div>
        <div class="field">
          <label><input type="checkbox" data-field="is_active" data-id="${p.id}" ${p.is_active ? 'checked' : ''}> Active (shown to businesses)</label>
        </div>
        <button class="btn btn-primary" data-save="${p.id}">Save changes</button>
      </div>`).join('');

    plansList.querySelectorAll('[data-save]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.save;
        const name = plansList.querySelector(`[data-field="name"][data-id="${id}"]`).value;
        const price = Number(plansList.querySelector(`[data-field="price"][data-id="${id}"]`).value);
        const isActive = plansList.querySelector(`[data-field="is_active"][data-id="${id}"]`).checked;
        await FrankyAuth.api(`/api/admin/plans/${id}`, { method: 'PATCH', body: JSON.stringify({ name, price, is_active: isActive }) });
        window.frankyToast && window.frankyToast('✓ Plan updated');
      });
    });
  }

  (async function init() {
    const ctx = await AdminShell.init('admin/plans.html');
    if (!ctx) return;
    const { plans } = await FrankyAuth.api('/api/admin/plans');
    render(plans);
  })();
})();
