(function () {
  const statsGrid = document.getElementById('statsGrid');
  (async function init() {
    const ctx = await AdminShell.init('admin/dashboard.html');
    if (!ctx) return;
    const stats = await FrankyAuth.api('/api/admin/stats');
    statsGrid.innerHTML = [
      ['Total users', stats.totalUsers],
      ['Active users', stats.activeUsers],
      ['New this month', stats.newUsersThisMonth],
      ['Total businesses', stats.totalBusinesses],
      ['Paying businesses', stats.payingBusinesses],
      ['Est. MRR', `$${stats.monthlyRecurringRevenueEstimate}`],
      ['Total reviews', stats.totalReviews],
      ['Feedback items', stats.totalFeedback],
      ['Qualified referrals', stats.qualifiedReferrals],
      ['Invoices created', stats.invoiceCount],
      ['Invoice volume', `$${stats.invoiceVolumeTotal}`],
    ].map(([l, n]) => `<div class="dash-card"><div class="l">${l}</div><div class="n">${n}</div></div>`).join('');
  })();
})();
