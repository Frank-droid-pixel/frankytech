/**
 * FRANKY TECH — Dashboard Page Logic
 * -----------------------------------------------------------
 * Theme toggling, scroll reveals etc. are already handled by
 * main.js (shared with the landing page). This file only
 * handles what's specific to the authenticated dashboard shell.
 * -----------------------------------------------------------
 */
(function () {
  const bizName = document.getElementById('bizName');
  const bizMenu = document.getElementById('bizSwitcherMenu');
  const bizBtn = document.getElementById('bizSwitcherBtn');
  const userAvatar = document.getElementById('userAvatar');
  const userName = document.getElementById('userName');
  const welcomeName = document.getElementById('welcomeName');
  const welcomeBiz = document.getElementById('welcomeBiz');
  const statsGrid = document.getElementById('statsGrid');
  const logoutBtn = document.getElementById('logoutBtn');

  logoutBtn.addEventListener('click', () => FrankyAuth.logout());

  bizBtn.addEventListener('click', () => bizMenu.classList.toggle('open'));
  document.addEventListener('click', (e) => {
    if (!bizBtn.contains(e.target) && !bizMenu.contains(e.target)) bizMenu.classList.remove('open');
  });

  function initials(name) {
    return String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  }

  const STAT_LABELS = [
    ['todaySales', "Today's sales"],
    ['monthlySales', 'Monthly sales'],
    ['expenses', 'Expenses'],
    ['profit', 'Profit'],
    ['outstandingInvoices', 'Outstanding invoices'],
    ['overdueInvoices', 'Overdue invoices'],
    ['customers', 'Customers'],
    ['products', 'Products'],
  ];

  function renderStats(stats, currency) {
    statsGrid.innerHTML = STAT_LABELS.map(([key, label]) => {
      const isMoney = ['todaySales', 'monthlySales', 'expenses', 'profit'].includes(key);
      const value = stats[key] ?? 0;
      const display = isMoney ? `${currency} ${Number(value).toLocaleString()}` : Number(value).toLocaleString();
      return `
        <div class="dash-card">
          <div class="l">${label}</div>
          <div class="n">${display}</div>
          <div class="trend">No data yet</div>
        </div>`;
    }).join('');
  }

  async function loadDashboard(businessId) {
    try {
      const data = await FrankyAuth.api(`/api/dashboard/summary?businessId=${encodeURIComponent(businessId)}`);
      bizName.textContent = data.business.name;
      welcomeBiz.textContent = data.business.name;
      renderStats(data.stats, data.business.currency);
    } catch (err) {
      statsGrid.innerHTML = `<div class="dash-empty">Could not load dashboard data: ${err.message}</div>`;
    }
  }

  function renderBusinessMenu(businesses, currentId) {
    bizMenu.innerHTML = businesses.map((b) => `<a href="#" data-id="${b.id}">${FrankyAuth.escapeHtml(b.name)}${b.id === currentId ? ' ✓' : ''}</a>`).join('')
      + '<a href="/onboarding.html" style="border-top:1px solid var(--border); color:var(--primary); font-weight:600;">+ Add another business</a>';

    bizMenu.querySelectorAll('a[data-id]').forEach((a) => {
      a.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = a.dataset.id;
        bizMenu.classList.remove('open');
        await FrankyAuth.api(`/api/businesses/${id}/select`, { method: 'POST' });
        loadDashboard(id);
        window.frankyToast && window.frankyToast('✓ Switched business');
      });
    });
  }

  (async function init() {
    const session = await FrankyAuth.requireSession();
    if (!session) return;

    if (!session.businesses || session.businesses.length === 0) {
      window.location.href = '/onboarding.html';
      return;
    }

    userName.textContent = session.user.fullName;
    userAvatar.textContent = initials(session.user.fullName);
    welcomeName.textContent = `, ${session.user.fullName.split(' ')[0]}`;

    const currentId = session.currentBusinessId || session.businesses[0].id;
    renderBusinessMenu(session.businesses, currentId);
    loadDashboard(currentId);
  })();
})();
