(function () {
  const referralUrlEl = document.getElementById('referralUrl');
  const copyBtn = document.getElementById('copyBtn');
  const waBtn = document.getElementById('waBtn');
  const statsGrid = document.getElementById('statsGrid');
  const historyList = document.getElementById('historyList');
  const emptyState = document.getElementById('emptyState');

  function fmtDate(d) { return new Date(d).toLocaleDateString(); }

  (async function init() {
    const ctx = await AppShell.init('referrals.html');
    if (!ctx) return;

    const data = await FrankyAuth.api('/api/referrals/dashboard');
    referralUrlEl.textContent = data.referralUrl;

    copyBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(data.referralUrl).catch(() => {});
      window.frankyToast && window.frankyToast('✓ Link copied');
    });
    waBtn.addEventListener('click', () => {
      const msg = `Join me on FRANKY TECH — a platform for managing invoices, customers and more: ${data.referralUrl}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    });

    const s = data.stats;
    statsGrid.innerHTML = [
      ['Clicks', s.clicks],
      ['Registrations', s.registrations],
      ['Active referrals', s.active_referrals],
      ['Pending rewards', `$${s.pending_rewards}`],
    ].map(([l, n]) => `<div class="dash-card"><div class="l">${l}</div><div class="n">${n}</div></div>`).join('');

    if (data.history.length === 0) {
      emptyState.style.display = 'block';
    } else {
      historyList.innerHTML = `<table class="data-table"><thead><tr><th>Name</th><th>Joined</th><th>Status</th><th>Reward</th></tr></thead>
        <tbody>${data.history.map((h) => `<tr><td>${FrankyAuth.escapeHtml(h.referred_name)}</td><td>${fmtDate(h.referred_joined_at)}</td><td><span class="badge badge-${h.status === 'paid' ? 'paid' : h.status === 'qualified' ? 'sent' : 'draft'}">${h.status}</span></td><td>${h.currency} ${h.amount}</td></tr>`).join('')}</tbody></table>`;
    }
  })();
})();
