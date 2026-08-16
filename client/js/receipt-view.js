(function () {
  let businessId = null, receiptId = null;
  function money(n, cur) { return `${cur || ''} ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.trim(); }

  (async function init() {
    const ctx = await AppShell.init('receipts.html');
    if (!ctx) return;
    businessId = ctx.businessId;
    receiptId = new URLSearchParams(window.location.search).get('id');
    if (!receiptId) { window.location.href = '/receipts.html'; return; }

    const { receipt } = await FrankyAuth.api(`/api/receipts/${receiptId}?businessId=${businessId}`);
    document.getElementById('receiptTitle').textContent = `Receipt ${receipt.receipt_number}`;
    document.getElementById('pdfLink').href = `/api/receipts/${receipt.id}/pdf?businessId=${businessId}`;
    document.getElementById('docView').innerHTML = `
      <div class="doc-head">
        <div>
          <div style="color:var(--text-muted); font-size:var(--small);">Received from</div>
          <div style="font-weight:700; font-size:1.1rem;">${FrankyAuth.escapeHtml(receipt.customer_name)}</div>
        </div>
        <div style="text-align:right; font-size:var(--small); color:var(--text-muted);">
          <div>For invoice: ${receipt.invoice_number}</div>
          <div>Date: ${new Date(receipt.created_at).toLocaleDateString()}</div>
        </div>
      </div>
      <div style="background:var(--primary); color:#fff; padding:20px; border-radius:var(--radius-md); margin:20px 0;">
        <div style="font-size:0.85rem; opacity:0.8;">Amount received</div>
        <div style="font-size:1.6rem; font-weight:700;">${money(receipt.amount, receipt.currency)}</div>
      </div>
      <p><strong>Method:</strong> ${String(receipt.method || '').replace('_', ' ')}</p>
      <p><strong>Balance remaining on invoice:</strong> ${money(receipt.balance_after, receipt.currency)}</p>
    `;
  })();
})();
