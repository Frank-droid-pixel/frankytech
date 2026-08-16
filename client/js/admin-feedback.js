(function () {
  const tableBody = document.getElementById('tableBody');
  const emptyState = document.getElementById('emptyState');
  const STATUSES = ['new', 'reviewing', 'planned', 'in_progress', 'completed', 'rejected'];

  async function load() {
    const { feedback } = await FrankyAuth.api('/api/admin/feedback');
    if (feedback.length === 0) { tableBody.innerHTML = ''; emptyState.style.display = 'block'; return; }
    emptyState.style.display = 'none';
    tableBody.innerHTML = feedback.map((f) => `
      <tr>
        <td>${f.full_name ? FrankyAuth.escapeHtml(f.full_name) : 'Unknown'}<br><span style="color:var(--text-muted); font-size:var(--caption);">${f.email ? FrankyAuth.escapeHtml(f.email) : ''}</span></td>
        <td>${f.type.replace('_', ' ')}</td>
        <td style="max-width:360px;">${FrankyAuth.escapeHtml(f.message)}</td>
        <td><select data-status="${f.id}">${STATUSES.map((s) => `<option value="${s}" ${s === f.status ? 'selected' : ''}>${s.replace('_', ' ')}</option>`).join('')}</select></td>
      </tr>`).join('');

    tableBody.querySelectorAll('[data-status]').forEach((sel) => {
      sel.addEventListener('change', async () => {
        await FrankyAuth.api(`/api/admin/feedback/${sel.dataset.status}/status`, { method: 'PATCH', body: JSON.stringify({ status: sel.value }) });
        window.frankyToast && window.frankyToast('✓ Status updated');
      });
    });
  }

  (async function init() {
    const ctx = await AdminShell.init('admin/feedback.html');
    if (!ctx) return;
    load();
  })();
})();
