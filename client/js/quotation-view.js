(function () {
  let businessId = null, quotationId = null, current = null;
  const docView = document.getElementById('docView');
  const pdfLink = document.getElementById('pdfLink');
  const sendBtn = document.getElementById('sendBtn');
  const acceptBtn = document.getElementById('acceptBtn');
  const rejectBtn = document.getElementById('rejectBtn');
  const convertBtn = document.getElementById('convertBtn');
  const waShareBtn = document.getElementById('waShareBtn');
  const shareBtn = document.getElementById('shareBtn');

  function money(n, cur) { return `${cur || ''} ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.trim(); }
  function fmtDate(d) { return d ? new Date(d).toLocaleDateString() : '—'; }

  function render(q) {
    current = q;
    document.getElementById('quoteTitle').textContent = `Quotation ${q.quotation_number}`;
    document.getElementById('quoteSubtitle').innerHTML = `<span class="badge badge-${q.status}">${q.status}</span>`;
    docView.innerHTML = `
      <div class="doc-head">
        <div>
          <div style="font-weight:700; font-size:1.1rem;">${FrankyAuth.escapeHtml(q.customer_name)}</div>
          <div style="color:var(--text-muted); font-size:var(--small);">${q.customer_email ? FrankyAuth.escapeHtml(q.customer_email) : ''}</div>
        </div>
        <div style="text-align:right; font-size:var(--small); color:var(--text-muted);">
          <div>Issue date: ${fmtDate(q.issue_date)}</div>
          <div>Valid until: ${fmtDate(q.valid_until)}</div>
        </div>
      </div>
      <table>
        <thead><tr><th>Description</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Unit price</th><th style="text-align:right;">Total</th></tr></thead>
        <tbody>${q.items.map((it) => `<tr><td>${FrankyAuth.escapeHtml(it.description)}</td><td style="text-align:right;">${it.quantity}</td><td style="text-align:right;">${money(it.unit_price, q.currency)}</td><td style="text-align:right;">${money(it.line_total, q.currency)}</td></tr>`).join('')}</tbody>
      </table>
      <div class="builder-totals">
        <div class="row"><span>Subtotal</span><span>${money(q.subtotal, q.currency)}</span></div>
        <div class="row"><span>Discount</span><span>-${money(q.discount_amount, q.currency)}</span></div>
        <div class="row"><span>Tax</span><span>${money(q.tax_amount, q.currency)}</span></div>
        <div class="row total"><span>Total</span><span>${money(q.total, q.currency)}</span></div>
      </div>
      ${q.notes ? `<p style="margin-top:20px;"><strong>Notes:</strong> ${FrankyAuth.escapeHtml(q.notes)}</p>` : ''}
    `;
    pdfLink.href = `/api/quotations/${q.id}/pdf?businessId=${businessId}`;
    const isConverted = q.status === 'converted';
    sendBtn.style.display = q.status === 'draft' ? 'inline-flex' : 'none';
    acceptBtn.style.display = !isConverted && q.status !== 'accepted' ? 'inline-flex' : 'none';
    rejectBtn.style.display = !isConverted && q.status !== 'rejected' ? 'inline-flex' : 'none';
    convertBtn.style.display = q.status === 'accepted' ? 'inline-flex' : 'none';
    if (isConverted) {
      convertBtn.outerHTML = `<a class="btn btn-ghost" href="/invoice-view.html?id=${q.converted_invoice_id}">View converted invoice →</a>`;
    }
    waShareBtn.onclick = () => {
      const msg = `Hello ${q.customer_name}, here is your quotation ${q.quotation_number} for ${money(q.total, q.currency)}.`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    };

    shareBtn.onclick = async () => {
      try {
        const { url } = await FrankyAuth.api(`/api/shares/quotation/${q.id}?businessId=${businessId}`, { method: 'POST' });
        await navigator.clipboard.writeText(url).catch(() => {});
        window.frankyToast && window.frankyToast('✓ Portal link copied to clipboard');
        prompt('Customer portal link (copied to clipboard):', url);
      } catch (err) {
        alert(err.message);
      }
    };
  }

  async function reload() {
    const { quotation } = await FrankyAuth.api(`/api/quotations/${quotationId}?businessId=${businessId}`);
    render(quotation);
  }

  async function setStatus(status) {
    await FrankyAuth.api(`/api/quotations/${quotationId}/status?businessId=${businessId}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    window.frankyToast && window.frankyToast(`✓ Quotation marked ${status}`);
    reload();
  }

  sendBtn.addEventListener('click', () => setStatus('sent'));
  acceptBtn.addEventListener('click', () => setStatus('accepted'));
  rejectBtn.addEventListener('click', () => setStatus('rejected'));
  convertBtn.addEventListener('click', async () => {
    if (!confirm('Convert this quotation into a real invoice?')) return;
    try {
      const { invoice } = await FrankyAuth.api(`/api/quotations/${quotationId}/convert?businessId=${businessId}`, { method: 'POST' });
      window.frankyToast && window.frankyToast('✓ Converted to invoice');
      window.location.href = `/invoice-view.html?id=${invoice.id}`;
    } catch (err) {
      alert(err.message);
    }
  });

  (async function init() {
    const ctx = await AppShell.init('quotations.html');
    if (!ctx) return;
    businessId = ctx.businessId;
    quotationId = new URLSearchParams(window.location.search).get('id');
    if (!quotationId) { window.location.href = '/quotations.html'; return; }
    reload();
  })();
})();
