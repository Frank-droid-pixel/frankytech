/**
 * FRANKY TECH — Invoice View Page
 */
(function () {
  let businessId = null;
  let invoiceId = null;
  let currentInvoice = null;

  const docView = document.getElementById('docView');
  const pdfLink = document.getElementById('pdfLink');
  const sendBtn = document.getElementById('sendBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const waShareBtn = document.getElementById('waShareBtn');
  const shareBtn = document.getElementById('shareBtn');
  const recordPaymentBtn = document.getElementById('recordPaymentBtn');
  const paymentsList = document.getElementById('paymentsList');

  const paymentModalOverlay = document.getElementById('paymentModalOverlay');
  const paymentModalClose = document.getElementById('paymentModalClose');
  const paymentForm = document.getElementById('paymentForm');
  const paymentAlert = document.getElementById('paymentAlert');
  const paymentSaveBtn = document.getElementById('paymentSaveBtn');

  function money(n, cur) { return `${cur || ''} ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.trim(); }
  function fmtDate(d) { return d ? new Date(d).toLocaleDateString() : '—'; }

  function render(invoice) {
    currentInvoice = invoice;
    document.getElementById('invoiceTitle').textContent = `Invoice ${invoice.invoice_number}`;
    document.getElementById('invoiceSubtitle').innerHTML = `<span class="badge badge-${invoice.status}">${invoice.status.replace('_', ' ')}</span>`;

    docView.innerHTML = `
      <div class="doc-head">
        <div>
          <div style="font-weight:700; font-size:1.1rem;">${FrankyAuth.escapeHtml(invoice.customer_name)}</div>
          <div style="color:var(--text-muted); font-size:var(--small);">${invoice.customer_email ? FrankyAuth.escapeHtml(invoice.customer_email) : ''}</div>
          <div style="color:var(--text-muted); font-size:var(--small);">${invoice.customer_address ? FrankyAuth.escapeHtml(invoice.customer_address) : ''}</div>
        </div>
        <div style="text-align:right; font-size:var(--small); color:var(--text-muted);">
          <div>Issue date: ${fmtDate(invoice.issue_date)}</div>
          <div>Due date: ${fmtDate(invoice.due_date)}</div>
        </div>
      </div>
      <table>
        <thead><tr><th>Description</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Unit price</th><th style="text-align:right;">Total</th></tr></thead>
        <tbody>
          ${invoice.items.map((it) => `<tr><td>${FrankyAuth.escapeHtml(it.description)}</td><td style="text-align:right;">${it.quantity}</td><td style="text-align:right;">${money(it.unit_price, invoice.currency)}</td><td style="text-align:right;">${money(it.line_total, invoice.currency)}</td></tr>`).join('')}
        </tbody>
      </table>
      <div class="builder-totals">
        <div class="row"><span>Subtotal</span><span>${money(invoice.subtotal, invoice.currency)}</span></div>
        <div class="row"><span>Discount</span><span>-${money(invoice.discount_amount, invoice.currency)}</span></div>
        <div class="row"><span>Tax</span><span>${money(invoice.tax_amount, invoice.currency)}</span></div>
        <div class="row"><span>Shipping</span><span>${money(invoice.shipping_amount, invoice.currency)}</span></div>
        <div class="row"><span>Labour</span><span>${money(invoice.labour_amount, invoice.currency)}</span></div>
        <div class="row total"><span>Total</span><span>${money(invoice.total, invoice.currency)}</span></div>
        <div class="row" style="color:var(--success);"><span>Paid</span><span>${money(invoice.paid_amount, invoice.currency)}</span></div>
        <div class="row" style="color:${invoice.balance_amount > 0 ? 'var(--danger)' : 'var(--success)'}; font-weight:700;"><span>Balance due</span><span>${money(invoice.balance_amount, invoice.currency)}</span></div>
      </div>
      ${invoice.notes ? `<p style="margin-top:20px;"><strong>Notes:</strong> ${FrankyAuth.escapeHtml(invoice.notes)}</p>` : ''}
      ${invoice.terms ? `<p><strong>Terms:</strong> ${FrankyAuth.escapeHtml(invoice.terms)}</p>` : ''}
    `;

    pdfLink.href = `/api/invoices/${invoice.id}/pdf?businessId=${businessId}`;
    sendBtn.style.display = invoice.status === 'draft' ? 'inline-flex' : 'none';
    cancelBtn.style.display = invoice.status === 'paid' || invoice.status === 'cancelled' ? 'none' : 'inline-flex';
    recordPaymentBtn.style.display = invoice.balance_amount > 0 && invoice.status !== 'cancelled' ? 'inline-flex' : 'none';
    document.getElementById('balanceDisplay').textContent = money(invoice.balance_amount, invoice.currency);

    waShareBtn.onclick = () => {
      const msg = `Hello ${invoice.customer_name}, here is your invoice ${invoice.invoice_number} for ${money(invoice.total, invoice.currency)}. Balance due: ${money(invoice.balance_amount, invoice.currency)}.`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    };

    shareBtn.onclick = async () => {
      try {
        const { url } = await FrankyAuth.api(`/api/shares/invoice/${invoice.id}?businessId=${businessId}`, { method: 'POST' });
        await navigator.clipboard.writeText(url).catch(() => {});
        window.frankyToast && window.frankyToast('✓ Portal link copied to clipboard');
        prompt('Customer portal link (copied to clipboard):', url);
      } catch (err) {
        alert(err.message);
      }
    };
  }

  async function loadPayments() {
    const { payments } = await FrankyAuth.api(`/api/invoices/${invoiceId}/payments?businessId=${businessId}`);
    if (payments.length === 0) {
      paymentsList.className = 'dash-empty';
      paymentsList.textContent = 'No payments recorded yet.';
      return;
    }
    paymentsList.className = '';
    paymentsList.innerHTML = `
      <table class="data-table" style="border:1px solid var(--border); border-radius:var(--radius-sm);">
        <thead><tr><th>Date</th><th>Method</th><th>Reference</th><th>Amount</th></tr></thead>
        <tbody>${payments.map((p) => `<tr><td>${new Date(p.paid_at).toLocaleString()}</td><td>${p.method.replace('_', ' ')}</td><td>${p.reference || '—'}</td><td>${money(p.amount, p.currency)}</td></tr>`).join('')}</tbody>
      </table>`;
  }

  async function reload() {
    const { invoice } = await FrankyAuth.api(`/api/invoices/${invoiceId}?businessId=${businessId}`);
    render(invoice);
    loadPayments();
  }

  sendBtn.addEventListener('click', async () => {
    await FrankyAuth.api(`/api/invoices/${invoiceId}/send?businessId=${businessId}`, { method: 'POST' });
    window.frankyToast && window.frankyToast('✓ Invoice marked as sent');
    reload();
  });

  cancelBtn.addEventListener('click', async () => {
    if (!confirm('Cancel this invoice? This cannot be undone.')) return;
    await FrankyAuth.api(`/api/invoices/${invoiceId}/cancel?businessId=${businessId}`, { method: 'POST' });
    window.frankyToast && window.frankyToast('✓ Invoice cancelled');
    reload();
  });

  recordPaymentBtn.addEventListener('click', () => {
    paymentForm.reset();
    FrankyAuth.hideAlert(paymentAlert);
    document.getElementById('amount').value = currentInvoice.balance_amount;
    paymentModalOverlay.classList.add('open');
  });
  paymentModalClose.addEventListener('click', () => paymentModalOverlay.classList.remove('open'));
  paymentModalOverlay.addEventListener('click', (e) => { if (e.target === paymentModalOverlay) paymentModalOverlay.classList.remove('open'); });

  paymentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    FrankyAuth.hideAlert(paymentAlert);
    FrankyAuth.clearFieldErrors(paymentForm);
    FrankyAuth.setLoading(paymentSaveBtn, true);
    const data = Object.fromEntries(new FormData(paymentForm).entries());
    try {
      const result = await FrankyAuth.api(`/api/invoices/${invoiceId}/payments?businessId=${businessId}`, {
        method: 'POST',
        body: JSON.stringify({ amount: Number(data.amount), method: data.method, reference: data.reference }),
      });
      paymentModalOverlay.classList.remove('open');
      window.frankyToast && window.frankyToast(`✓ Payment recorded — receipt ${result.receipt.receipt_number}`);
      reload();
    } catch (err) {
      FrankyAuth.showAlert(paymentAlert, err.message);
      FrankyAuth.applyFieldErrors(paymentForm, err.details);
    } finally {
      FrankyAuth.setLoading(paymentSaveBtn, false);
    }
  });

  (async function init() {
    const ctx = await AppShell.init('invoices.html');
    if (!ctx) return;
    businessId = ctx.businessId;
    invoiceId = new URLSearchParams(window.location.search).get('id');
    if (!invoiceId) { window.location.href = '/invoices.html'; return; }
    reload();
  })();
})();
