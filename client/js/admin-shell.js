/**
 * FRANKY TECH — Admin Shell
 * -----------------------------------------------------------
 * Separate from AppShell (client/js/app-shell.js) on purpose:
 * admin pages are platform-wide, not scoped to a business, so
 * there's no business switcher here — just a guard that only
 * a platform admin can pass.
 * -----------------------------------------------------------
 */
const AdminShell = (function () {
  const NAV_ITEMS = [
    ['admin/dashboard.html', 'Overview'],
    ['admin/users.html', 'Users'],
    ['admin/reviews.html', 'Review moderation'],
    ['admin/feedback.html', 'Feedback'],
    ['admin/plans.html', 'Plans'],
    ['admin/announcements.html', 'Announcements'],
    ['admin/audit-logs.html', 'Audit logs'],
  ];

  function render(activePage) {
    const root = document.getElementById('appShellRoot');
    if (!root) return;
    root.innerHTML = `
      <div class="app-shell">
        <aside class="app-sidebar">
          <div class="brand">
            <img src="/assets/logo/icon.png" width="32" height="32" alt="">
            <span class="w">FRANKY<span> TECH</span></span>
          </div>
          <div style="font-size:var(--caption); color:var(--text-muted); text-transform:uppercase; letter-spacing:0.06em; padding:0 6px;">Admin</div>
          <nav class="app-nav">
            ${NAV_ITEMS.map(([href, label]) => `<a href="/${href}" class="${href === activePage ? 'active' : ''}">${label}</a>`).join('')}
            <a href="/dashboard.html" style="margin-top:12px; border-top:1px solid var(--border); padding-top:16px;">← Back to my business</a>
          </nav>
        </aside>
        <div class="app-main">
          <header class="app-topbar">
            <div></div>
            <div class="topbar-actions">
              <div class="user-chip"><span id="adminUserName">—</span></div>
              <button class="btn btn-ghost" id="logoutBtn" type="button">Log out</button>
            </div>
          </header>
          <main class="dash-content" id="appContent"></main>
        </div>
      </div>`;

    const template = document.getElementById('pageContentTemplate');
    if (template) document.getElementById('appContent').appendChild(template.content.cloneNode(true));

    document.getElementById('logoutBtn').addEventListener('click', () => FrankyAuth.logout());
  }

  async function init(activePage) {
    const session = await FrankyAuth.requireSession();
    if (!session) return null;
    if (!session.user.isPlatformAdmin) {
      document.body.innerHTML = '<div style="padding:60px; text-align:center; font-family:sans-serif;"><h1>403 — Admin access required</h1><p>This area is restricted to FRANKY TECH platform administrators.</p><a href="/dashboard.html">← Back to my dashboard</a></div>';
      return null;
    }
    render(activePage);
    document.getElementById('adminUserName').textContent = session.user.fullName;
    return { session };
  }

  return { init };
})();
