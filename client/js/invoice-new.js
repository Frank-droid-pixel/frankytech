/**
 * FRANKY TECH — New Invoice Page
 */
(function () {
  let businessId = null;
  let currency = 'USD';
  let builder = null;

  const form = document.getElementById('invoiceForm');
  const alertEl = document.getElementById('formAlert');
  const saveBtn = document.getElementById('saveBtn');
  const customerSelect = document.getElementById('customerId');
  const addLineBtn = document.getElementById('addLineBtn');

  async function loadCustomers() {
    const { items } = await FrankyAuth.api(`/api/customers?businessId=${businessId}&limit=200`);
    if (items.length === 0) {
      customerSelect.innerHTML = '<option value="">No customers yet</option>';
      FrankyAuth.showAlert(alertEl, 'You need at least one customer before creating an invoice. ');
      alertEl.innerHTML += '<a href="/customers.html" style="font-weight:700;">Add a customer →</a>';
      return;
    }
    customerSelect.innerHTML = '<option value="">Select a customer</option>' + items.map((c) => `<option value="${c.id}">${FrankyAuth.escapeHtml(c.name)}</option>`).join('');
  }

  async function loadItemsCache() {
    const { items } = await FrankyAuth.api(`/api/items?businessId=${businessId}&limit=500`);
    return items.filter((i) => i.is_active !== false);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    FrankyAuth.hideAlert(alertEl);
    FrankyAuth.clearFieldErrors(form);
    FrankyAuth.setLoading(saveBtn, true);

    const lines = builder.getLines().filter((l) => l.description && l.quantity > 0);
    const payload = {
      customerId: customerSelect.value,
      dueDate: document.getElementById('dueDate').value || null,
      discountType: document.getElementById('discountType').value,
      discountValue: Number(document.getElementById('discountValue').value) || 0,
      shippingAmount: Number(document.getElementById('shippingAmount').value) || 0,
      labourAmount: Number(document.getElementById('labourAmount').value) || 0,
      notes: document.getElementById('notes').value,
      terms: document.getElementById('terms').value,
      items: lines,
    };

    try {
      const { invoice } = await FrankyAuth.api(`/api/invoices?businessId=${businessId}`, { method: 'POST', body: JSON.stringify(payload) });
      window.location.href = `/invoice-view.html?id=${invoice.id}`;
    } catch (err) {
      FrankyAuth.showAlert(alertEl, err.message);
      FrankyAuth.applyFieldErrors(form, err.details);
    } finally {
      FrankyAuth.setLoading(saveBtn, false);
    }
  });

  (async function init() {
    const ctx = await AppShell.init('invoices.html');
    if (!ctx) return;
    businessId = ctx.businessId;
    currency = ctx.currency || 'USD';

    await loadCustomers();
    const itemsCache = await loadItemsCache();

    builder = DocumentBuilder.create({ containerId: 'builderLines', businessId, currency, itemsCache });
    builder.addLine();
    addLineBtn.addEventListener('click', () => builder.addLine());
  })();
})();
