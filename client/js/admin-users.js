(function () {
  const tableBody = document.getElementById('tableBody');
  const searchInput = document.getElementById('searchInput');

  function render(users) {
    tableBody.innerHTML = users.map((u) => `
      <tr>
        <td>${FrankyAuth.escapeHtml(u.full_name)}${u.is_platform_admin ? ' <span class="badge badge-paid">admin</span>' : ''}</td>
        <td>${FrankyAuth.escapeHtml(u.email)}</td>
        <td>${u.business_count}</td>
        <td><span class="badge badge-${u.status === 'active' ? 'paid' : 'overdue'}">${u.status}</span></td>
        <td>${new Date(u.created_at).toLocaleDateString()}</td>
        <td>${u.status === 'active'
          ? `<button class="btn btn-ghost" data-suspend="${u.id}" style="padding:6px 12px; font-size:var(--caption); color:var(--danger); border-color:var(--danger);">Suspend</button>`
          : `<button class="btn btn-ghost" data-activate="${u.id}" style="padding:6px 12px; font-size:var(--caption); color:var(--success); border-color:var(--success);">Reactivate</button>`}
        </td>
      </tr>`).join('');

    tableBody.querySelectorAll('[data-suspend]').forEach((btn) => btn.addEventListener('click', async () => {
      if (!confirm('Suspend this user? They will be unable to log in.')) return;
      await FrankyAuth.api(`/api/admin/users/${btn.dataset.suspend}/suspend`, { method: 'POST' });
      window.frankyToast && window.frankyToast('✓ User suspended');
      load();
    }));
    tableBody.querySelectorAll('[data-activate]').forEach((btn) => btn.addEventListener('click', async () => {
      await FrankyAuth.api(`/api/admin/users/${btn.dataset.activate}/activate`, { method: 'POST' });
      window.frankyToast && window.frankyToast('✓ User reactivated');
      load();
    }));
  }

  let searchTimeout;
  async function load() {
    const qs = new URLSearchParams(searchInput.value.trim() ? { search: searchInput.value.trim() } : {});
    const { users } = await FrankyAuth.api(`/api/admin/users?${qs.toString()}`);
    render(users);
  }
  searchInput.addEventListener('input', () => { clearTimeout(searchTimeout); searchTimeout = setTimeout(load, 300); });

  (async function init() {
    const ctx = await AdminShell.init('admin/users.html');
    if (!ctx) return;
    load();
  })();
})();
