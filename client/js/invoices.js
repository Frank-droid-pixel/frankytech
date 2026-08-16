/**
 * FRANKY TECH — Invoices List Page
 */
(function () {
  let businessId = null;
  let currency = 'USD';

  const tableBody = document.getElementById('tableBody');
  const emptyState = document.getElementById('emptyState');
  const statusFilter = document.getElementById('statusFilter');

  function money(n) { return `${currency} ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
  function fmtDate(d) { return d ? new Date(d).toLocaleDateString() : '—'; }

  function renderRows(invoices) {
    if (invoices.length === 0) {
      tableBody.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';
    tableBody.innerHTML = invoices.map((inv) => `
      <tr>
        <td><a class="row-link" href="/invoice-view.html?id=${inv.id}">${inv.invoice_number}</a></td>
        <td>${FrankyAuth.escapeHtml(inv.customer_name)}</td>
        <td>${fmtDate(inv.issue_date)}</td>
        <td>${fmtDate(inv.due_date)}</td>
        <td>${money(inv.total)}</td>
        <td>${money(inv.balance_amount)}</td>
        <td><span class="badge badge-${inv.status}">${inv.status.replace('_', ' ')}</span></td>
      </tr>`).join('');
  }

  async function loadInvoices() {
    const qs = new URLSearchParams({ businessId, ...(statusFilter.value ? { status: statusFilter.value } : {}) });
    const { items } = await FrankyAuth.api(`/api/invoices?${qs.toString()}`);
    renderRows(items);
  }

  statusFilter.addEventListener('change', loadInvoices);

  (async function init() {
    const ctx = await AppShell.init('invoices.html');
    if (!ctx) return;
    businessId = ctx.businessId;
    currency = ctx.currency || 'USD';
    loadInvoices();
  })();
})();
