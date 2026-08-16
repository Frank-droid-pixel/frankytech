(function () {
  let businessId = null;
  let currency = 'USD';
  const tableBody = document.getElementById('tableBody');
  const emptyState = document.getElementById('emptyState');
  const statusFilter = document.getElementById('statusFilter');

  function money(n) { return `${currency} ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
  function fmtDate(d) { return d ? new Date(d).toLocaleDateString() : '—'; }

  function renderRows(items) {
    if (items.length === 0) { tableBody.innerHTML = ''; emptyState.style.display = 'block'; return; }
    emptyState.style.display = 'none';
    tableBody.innerHTML = items.map((q) => `
      <tr>
        <td><a class="row-link" href="/quotation-view.html?id=${q.id}">${q.quotation_number}</a></td>
        <td>${FrankyAuth.escapeHtml(q.customer_name)}</td>
        <td>${fmtDate(q.issue_date)}</td>
        <td>${fmtDate(q.valid_until)}</td>
        <td>${money(q.total)}</td>
        <td><span class="badge badge-${q.status}">${q.status}</span></td>
      </tr>`).join('');
  }

  async function load() {
    const qs = new URLSearchParams({ businessId, ...(statusFilter.value ? { status: statusFilter.value } : {}) });
    const { items } = await FrankyAuth.api(`/api/quotations?${qs.toString()}`);
    renderRows(items);
  }
  statusFilter.addEventListener('change', load);

  (async function init() {
    const ctx = await AppShell.init('quotations.html');
    if (!ctx) return;
    businessId = ctx.businessId;
    currency = ctx.currency || 'USD';
    load();
  })();
})();
