(function () {
  let businessId = null, currency = 'USD';
  const tableBody = document.getElementById('tableBody');
  const emptyState = document.getElementById('emptyState');
  function money(n) { return `${currency} ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

  function render(items) {
    if (items.length === 0) { tableBody.innerHTML = ''; emptyState.style.display = 'block'; return; }
    emptyState.style.display = 'none';
    tableBody.innerHTML = items.map((r) => `
      <tr>
        <td><a class="row-link" href="/receipt-view.html?id=${r.id}">${r.receipt_number}</a></td>
        <td>${FrankyAuth.escapeHtml(r.customer_name)}</td>
        <td>${r.invoice_number}</td>
        <td>${money(r.amount)}</td>
        <td>${new Date(r.created_at).toLocaleDateString()}</td>
      </tr>`).join('');
  }

  (async function init() {
    const ctx = await AppShell.init('receipts.html');
    if (!ctx) return;
    businessId = ctx.businessId;
    currency = ctx.currency || 'USD';
    const { receipts } = await FrankyAuth.api(`/api/receipts?businessId=${businessId}`);
    render(receipts);
  })();
})();
