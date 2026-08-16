(function () {
  const reviewList = document.getElementById('reviewList');
  const emptyState = document.getElementById('emptyState');

  async function load() {
    const { reviews } = await FrankyAuth.api('/api/admin/reviews?status=flagged');
    if (reviews.length === 0) { reviewList.innerHTML = ''; emptyState.style.display = 'block'; return; }
    emptyState.style.display = 'none';
    reviewList.innerHTML = reviews.map((r) => `
      <div class="review-card" style="max-width:700px; margin-bottom:14px;">
        <div style="font-size:var(--caption); color:var(--text-muted);">${FrankyAuth.escapeHtml(r.business_name)}</div>
        <div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
        <p>${r.comment ? FrankyAuth.escapeHtml(r.comment) : '<em>No comment.</em>'}</p>
        <div class="who"><span class="name">${FrankyAuth.escapeHtml(r.reviewer_name)}</span></div>
      </div>`).join('');
  }

  (async function init() {
    const ctx = await AdminShell.init('admin/reviews.html');
    if (!ctx) return;
    load();
  })();
})();
