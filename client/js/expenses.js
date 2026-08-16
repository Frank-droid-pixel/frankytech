(function () {
  let businessId = null, currency = 'USD';
  const tableBody = document.getElementById('tableBody');
  const emptyState = document.getElementById('emptyState');
  const addBtn = document.getElementById('addBtn');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalClose = document.getElementById('modalClose');
  const modalTitle = document.getElementById('modalTitle');
  const form = document.getElementById('expenseForm');
  const alertEl = document.getElementById('formAlert');
  const saveBtn = document.getElementById('saveBtn');

  function money(n) { return `${currency} ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

  function openModal(expense) {
    form.reset();
    FrankyAuth.hideAlert(alertEl);
    FrankyAuth.clearFieldErrors(form);
    document.getElementById('expenseDate').value = new Date().toISOString().slice(0, 10);
    if (expense) {
      modalTitle.textContent = 'Edit expense';
      Object.keys(expense).forEach((k) => {
        const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        const input = form.querySelector(`[name="${camel}"]`);
        if (input) input.value = k === 'expense_date' ? String(expense[k]).slice(0, 10) : expense[k] ?? '';
      });
      form.querySelector('[name="id"]').value = expense.id;
    } else {
      modalTitle.textContent = 'Add expense';
      form.querySelector('[name="id"]').value = '';
    }
    modalOverlay.classList.add('open');
  }
  function closeModal() { modalOverlay.classList.remove('open'); }
  addBtn.addEventListener('click', () => openModal(null));
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

  function render(items) {
    if (items.length === 0) { tableBody.innerHTML = ''; emptyState.style.display = 'block'; return; }
    emptyState.style.display = 'none';
    tableBody.innerHTML = items.map((e) => `
      <tr>
        <td>${new Date(e.expense_date).toLocaleDateString()}</td>
        <td>${e.category}</td>
        <td>${e.description || '—'}</td>
        <td>${(e.payment_method || '').replace('_', ' ')}</td>
        <td>${money(e.amount)}</td>
        <td style="display:flex; gap:6px;">
          <span class="row-link" data-edit="${e.id}" style="cursor:pointer;">Edit</span>
          <button class="icon-btn" data-delete="${e.id}" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg></button>
        </td>
      </tr>`).join('');

    tableBody.querySelectorAll('[data-edit]').forEach((el) => {
      el.addEventListener('click', async () => {
        const { items: all } = await FrankyAuth.api(`/api/expenses?businessId=${businessId}&limit=200`);
        openModal(all.find((x) => x.id === el.dataset.edit));
      });
    });
    tableBody.querySelectorAll('[data-delete]').forEach((el) => {
      el.addEventListener('click', async () => {
        if (!confirm('Delete this expense?')) return;
        await FrankyAuth.api(`/api/expenses/${el.dataset.delete}?businessId=${businessId}`, { method: 'DELETE' });
        window.frankyToast && window.frankyToast('✓ Expense deleted');
        load();
      });
    });
  }

  async function load() {
    const { items } = await FrankyAuth.api(`/api/expenses?businessId=${businessId}&limit=200`);
    render(items);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    FrankyAuth.hideAlert(alertEl);
    FrankyAuth.clearFieldErrors(form);
    FrankyAuth.setLoading(saveBtn, true);
    const data = Object.fromEntries(new FormData(form).entries());
    const id = data.id;
    delete data.id;
    try {
      if (id) await FrankyAuth.api(`/api/expenses/${id}?businessId=${businessId}`, { method: 'PATCH', body: JSON.stringify(data) });
      else await FrankyAuth.api(`/api/expenses?businessId=${businessId}`, { method: 'POST', body: JSON.stringify(data) });
      closeModal();
      window.frankyToast && window.frankyToast(id ? '✓ Expense updated' : '✓ Expense added');
      load();
    } catch (err) {
      FrankyAuth.showAlert(alertEl, err.message);
      FrankyAuth.applyFieldErrors(form, err.details);
    } finally {
      FrankyAuth.setLoading(saveBtn, false);
    }
  });

  (async function init() {
    const ctx = await AppShell.init('expenses.html');
    if (!ctx) return;
    businessId = ctx.businessId;
    currency = ctx.currency || 'USD';
    load();
  })();
})();
