(function () {
  const tableBody = document.getElementById('tableBody');

  (async function init() {
    const ctx = await AdminShell.init('admin/audit-logs.html');
    if (!ctx) return;
    const { logs } = await FrankyAuth.api('/api/admin/audit-logs');
    tableBody.innerHTML = logs.map((l) => `
      <tr>
        <td>${new Date(l.created_at).toLocaleString()}</td>
        <td>${l.full_name || 'System'}<br><span style="color:var(--text-muted); font-size:var(--caption);">${l.email || ''}</span></td>
        <td><code class="mono">${l.action}</code></td>
        <td>${l.resource || '—'}</td>
      </tr>`).join('');
  })();
})();
