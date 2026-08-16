/**
 * FRANKY TECH — Customer Portal (public, token-based)
 * No authentication — see migration 0003 note on document_shares.
 */
/**
 * FRANKY TECH — Local HTML escape (public page, no auth.js loaded)
 * See client/js/auth.js escapeHtml for the full rationale.
 */
function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

(function () {
  const content = document.getElementById('portalContent');
  const token = new URLSearchParams(window.location.search).get('token');

  function money(n, cur) { return `${cur || ''} ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.trim(); }
  function fmtDate(d) { return d ? new Date(d).toLocaleDateString() : '—'; }

  function renderInvoiceOrQuotation(doc, kind) {
    const numberField = kind === 'invoice' ? doc.invoice_number : doc.quotation_number;
    content.innerHTML = `
      <div class="doc-actions"><a class="btn btn-primary" href="/api/public/share/${token}/pdf" target="_blank">📄 Download PDF</a></div>
      <div class="doc-view">
        <div class="doc-head">
          <div>
            <div style="font-weight:700; font-size:1.1rem;">${escapeHtml(doc.customer_name)}</div>
            <div style="color:var(--text-muted); font-size:var(--small);">${doc.customer_email ? escapeHtml(doc.customer_email) : ''}</div>
          </div>
          <div style="text-align:right; font-size:var(--small); color:var(--text-muted);">
            <div>${kind === 'invoice' ? 'Invoice' : 'Quotation'} ${numberField}</div>
            <div>Issue date: ${fmtDate(doc.issue_date)}</div>
          </div>
        </div>
        <table>
          <thead><tr><th>Description</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Total</th></tr></thead>
          <tbody>${doc.items.map((it) => `<tr><td>${escapeHtml(it.description)}</td><td style="text-align:right;">${it.quantity}</td><td style="text-align:right;">${money(it.line_total, doc.currency)}</td></tr>`).join('')}</tbody>
        </table>
        <div class="builder-totals">
          <div class="row total"><span>Total</span><span>${money(doc.total, doc.currency)}</span></div>
          ${kind === 'invoice' ? `<div class="row" style="color:${doc.balance_amount > 0 ? 'var(--danger)' : 'var(--success)'};"><span>Balance due</span><span>${money(doc.balance_amount, doc.currency)}</span></div>` : ''}
        </div>
      </div>`;
  }

  function renderReceipt(doc) {
    content.innerHTML = `
      <div class="doc-actions"><a class="btn btn-primary" href="/api/public/share/${token}/pdf" target="_blank">📄 Download PDF</a></div>
      <div class="doc-view">
        <div class="doc-head">
          <div><div style="color:var(--text-muted); font-size:var(--small);">Received from</div><div style="font-weight:700; font-size:1.1rem;">${escapeHtml(doc.customer_name)}</div></div>
          <div style="text-align:right; font-size:var(--small); color:var(--text-muted);">Receipt ${doc.receipt_number}</div>
        </div>
        <div style="background:var(--primary); color:#fff; padding:20px; border-radius:var(--radius-md); margin:20px 0;">
          <div style="font-size:0.85rem; opacity:0.8;">Amount received</div>
          <div style="font-size:1.6rem; font-weight:700;">${money(doc.amount, doc.currency)}</div>
        </div>
      </div>`;
  }

  (async function init() {
    if (!token) {
      content.innerHTML = '<p style="text-align:center;">This link is missing or malformed.</p>';
      return;
    }
    try {
      const res = await fetch(`/api/public/share/${token}`);
      const data = await res.json();
      if (!res.ok) throw new Error((data.error && data.error.message) || 'This link is invalid or has expired.');

      if (data.docType === 'invoice') renderInvoiceOrQuotation(data.doc, 'invoice');
      else if (data.docType === 'quotation') renderInvoiceOrQuotation(data.doc, 'quotation');
      else renderReceipt(data.doc);
    } catch (err) {
      content.innerHTML = `<p style="text-align:center;">${err.message}</p>`;
    }
  })();
})();
