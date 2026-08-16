(function () {
  let businessId = null;
  const statusFilter = document.getElementById('statusFilter');
  const reviewList = document.getElementById('reviewList');
  const emptyState = document.getElementById('emptyState');
  const avgStars = document.getElementById('avgStars');
  const summaryText = document.getElementById('summaryText');
  const requestBtn = document.getElementById('requestBtn');

  const requestModalOverlay = document.getElementById('requestModalOverlay');
  const requestModalClose = document.getElementById('requestModalClose');
  const requestForm = document.getElementById('requestForm');
  const requestAlert = document.getElementById('requestAlert');
  const requestSaveBtn = document.getElementById('requestSaveBtn');
  const linkResult = document.getElementById('linkResult');
  const customerSelect = document.getElementById('customerId');
  const invoiceSelect = document.getElementById('invoiceId');

  const respondModalOverlay = document.getElementById('respondModalOverlay');
  const respondModalClose = document.getElementById('respondModalClose');
  const respondForm = document.getElementById('respondForm');
  const respondSaveBtn = document.getElementById('respondSaveBtn');
  let respondingReviewId = null;

  function stars(rating) {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  function renderList(reviews) {
    if (reviews.length === 0) { reviewList.innerHTML = ''; emptyState.style.display = 'block'; return; }
    emptyState.style.display = 'none';
    reviewList.innerHTML = reviews.map((r) => `
      <div class="review-card" style="max-width:700px; margin-bottom:14px;">
        <div class="stars">${stars(r.rating)}</div>
        <p>${r.comment ? FrankyAuth.escapeHtml(r.comment) : '<em>No comment left.</em>'}</p>
        <div class="who">
          <span class="avatar">${FrankyAuth.escapeHtml(r.reviewer_name.slice(0, 2).toUpperCase())}</span>
          <div>
            <div class="name">${FrankyAuth.escapeHtml(r.reviewer_name)}</div>
            ${r.is_verified ? '<div class="verified">✓ Verified customer</div>' : ''}
          </div>
          <span class="badge badge-${r.status}" style="margin-left:auto;">${r.status}</span>
        </div>
        ${r.business_response ? `<div style="margin-top:10px; padding:10px; background:var(--surface-secondary); border-radius:var(--radius-sm); font-size:var(--small);"><strong>Your response:</strong> ${FrankyAuth.escapeHtml(r.business_response)}</div>` : ''}
        <div style="display:flex; gap:8px; margin-top:12px;">
          ${r.status !== 'approved' ? `<button class="btn btn-ghost" data-approve="${r.id}" style="padding:6px 12px; font-size:var(--caption);">Approve</button>` : ''}
          ${r.status !== 'hidden' ? `<button class="btn btn-ghost" data-hide="${r.id}" style="padding:6px 12px; font-size:var(--caption);">Hide</button>` : ''}
          ${!r.business_response ? `<button class="btn btn-ghost" data-respond="${r.id}" style="padding:6px 12px; font-size:var(--caption);">Respond</button>` : ''}
        </div>
      </div>`).join('');

    reviewList.querySelectorAll('[data-approve]').forEach((el) => el.addEventListener('click', () => setStatus(el.dataset.approve, 'approved')));
    reviewList.querySelectorAll('[data-hide]').forEach((el) => el.addEventListener('click', () => setStatus(el.dataset.hide, 'hidden')));
    reviewList.querySelectorAll('[data-respond]').forEach((el) => el.addEventListener('click', () => openRespondModal(el.dataset.respond)));
  }

  async function setStatus(id, status) {
    await FrankyAuth.api(`/api/reviews/${id}/status?businessId=${businessId}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    window.frankyToast && window.frankyToast(`✓ Review ${status}`);
    load();
  }

  function openRespondModal(id) {
    respondingReviewId = id;
    respondForm.reset();
    respondModalOverlay.classList.add('open');
  }
  respondModalClose.addEventListener('click', () => respondModalOverlay.classList.remove('open'));
  respondModalOverlay.addEventListener('click', (e) => { if (e.target === respondModalOverlay) respondModalOverlay.classList.remove('open'); });
  respondForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    FrankyAuth.setLoading(respondSaveBtn, true);
    try {
      await FrankyAuth.api(`/api/reviews/${respondingReviewId}/respond?businessId=${businessId}`, {
        method: 'POST',
        body: JSON.stringify({ response: document.getElementById('response').value }),
      });
      respondModalOverlay.classList.remove('open');
      window.frankyToast && window.frankyToast('✓ Response posted');
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      FrankyAuth.setLoading(respondSaveBtn, false);
    }
  });

  async function load() {
    const qs = new URLSearchParams({ businessId, sort: 'newest', ...(statusFilter.value ? { status: statusFilter.value } : {}) });
    const { reviews } = await FrankyAuth.api(`/api/reviews?${qs.toString()}`);
    renderList(reviews);

    const { summary } = await FrankyAuth.api(`/api/public/reviews/business/${businessId}`);
    avgStars.textContent = stars(Math.round(summary.average));
    summaryText.textContent = `${summary.average.toFixed(1)} average from ${summary.total} approved review${summary.total === 1 ? '' : 's'}`;
  }
  statusFilter.addEventListener('change', load);

  requestBtn.addEventListener('click', async () => {
    requestForm.reset();
    FrankyAuth.hideAlert(requestAlert);
    linkResult.style.display = 'none';
    const [{ items: customers }, { items: invoices }] = await Promise.all([
      FrankyAuth.api(`/api/customers?businessId=${businessId}&limit=200`),
      FrankyAuth.api(`/api/invoices?businessId=${businessId}&status=paid&limit=200`),
    ]);
    customerSelect.innerHTML = '<option value="">Select a customer</option>' + customers.map((c) => `<option value="${c.id}">${FrankyAuth.escapeHtml(c.name)}</option>`).join('');
    invoiceSelect.innerHTML = '<option value="">None</option>' + invoices.map((i) => `<option value="${i.id}" data-customer="${i.customer_id}">${FrankyAuth.escapeHtml(i.invoice_number)} — ${FrankyAuth.escapeHtml(i.customer_name)}</option>`).join('');
    requestModalOverlay.classList.add('open');
  });
  requestModalClose.addEventListener('click', () => requestModalOverlay.classList.remove('open'));
  requestModalOverlay.addEventListener('click', (e) => { if (e.target === requestModalOverlay) requestModalOverlay.classList.remove('open'); });

  requestForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    FrankyAuth.hideAlert(requestAlert);
    FrankyAuth.setLoading(requestSaveBtn, true);
    try {
      const { request } = await FrankyAuth.api(`/api/reviews/request?businessId=${businessId}`, {
        method: 'POST',
        body: JSON.stringify({ customerId: customerSelect.value, invoiceId: invoiceSelect.value || null }),
      });
      const url = `${window.location.origin}/review-submit.html?token=${request.token}`;
      linkResult.style.display = 'block';
      linkResult.innerHTML = `Share this link with your customer:<br><strong>${url}</strong><br><br>
        <a class="btn btn-accent" target="_blank" href="https://wa.me/?text=${encodeURIComponent('Hi! We would love your feedback: ' + url)}">Share via WhatsApp</a>`;
    } catch (err) {
      FrankyAuth.showAlert(requestAlert, err.message);
    } finally {
      FrankyAuth.setLoading(requestSaveBtn, false);
    }
  });

  (async function init() {
    const ctx = await AppShell.init('reviews.html');
    if (!ctx) return;
    businessId = ctx.businessId;
    load();
  })();
})();
