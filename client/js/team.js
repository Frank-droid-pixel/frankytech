(function () {
  let businessId = null;
  const membersBody = document.getElementById('membersBody');
  const invitesBody = document.getElementById('invitesBody');
  const emptyInvites = document.getElementById('emptyInvites');
  const inviteBtn = document.getElementById('inviteBtn');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalClose = document.getElementById('modalClose');
  const form = document.getElementById('inviteForm');
  const alertEl = document.getElementById('formAlert');
  const saveBtn = document.getElementById('saveBtn');

  const ROLE_OPTIONS = ['staff', 'sales', 'accountant', 'manager', 'admin'];

  function renderMembers(members) {
    membersBody.innerHTML = members.map((m) => `
      <tr>
        <td>${FrankyAuth.escapeHtml(m.full_name)}</td>
        <td>${FrankyAuth.escapeHtml(m.email)}</td>
        <td>${m.role === 'owner' ? '<span class="badge badge-paid">owner</span>' : `
          <select data-role-for="${m.membership_id}">${ROLE_OPTIONS.map((r) => `<option value="${r}" ${r === m.role ? 'selected' : ''}>${r}</option>`).join('')}</select>`}
        </td>
        <td>${m.role !== 'owner' ? `<button class="icon-btn" data-remove="${m.membership_id}" title="Remove"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg></button>` : ''}</td>
      </tr>`).join('');

    membersBody.querySelectorAll('[data-role-for]').forEach((sel) => {
      sel.addEventListener('change', async () => {
        await FrankyAuth.api(`/api/team/members/${sel.dataset.roleFor}?businessId=${businessId}`, { method: 'PATCH', body: JSON.stringify({ role: sel.value }) });
        window.frankyToast && window.frankyToast('✓ Role updated');
      });
    });
    membersBody.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remove this team member?')) return;
        await FrankyAuth.api(`/api/team/members/${btn.dataset.remove}?businessId=${businessId}`, { method: 'DELETE' });
        window.frankyToast && window.frankyToast('✓ Member removed');
        load();
      });
    });
  }

  function renderInvites(invites) {
    if (invites.length === 0) { invitesBody.innerHTML = ''; emptyInvites.style.display = 'block'; return; }
    emptyInvites.style.display = 'none';
    invitesBody.innerHTML = invites.map((i) => `
      <tr>
        <td>${FrankyAuth.escapeHtml(i.email)}</td>
        <td>${i.role}</td>
        <td>${new Date(i.created_at).toLocaleDateString()}</td>
        <td><button class="icon-btn" data-revoke="${i.id}" title="Revoke"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg></button></td>
      </tr>`).join('');
    invitesBody.querySelectorAll('[data-revoke]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await FrankyAuth.api(`/api/team/invitations/${btn.dataset.revoke}?businessId=${businessId}`, { method: 'DELETE' });
        window.frankyToast && window.frankyToast('✓ Invitation revoked');
        load();
      });
    });
  }

  async function load() {
    const { members, pendingInvitations } = await FrankyAuth.api(`/api/team?businessId=${businessId}`);
    renderMembers(members);
    renderInvites(pendingInvitations);
  }

  inviteBtn.addEventListener('click', () => { form.reset(); FrankyAuth.hideAlert(alertEl); modalOverlay.classList.add('open'); });
  modalClose.addEventListener('click', () => modalOverlay.classList.remove('open'));
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) modalOverlay.classList.remove('open'); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    FrankyAuth.hideAlert(alertEl);
    FrankyAuth.setLoading(saveBtn, true);
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      await FrankyAuth.api(`/api/team/invite?businessId=${businessId}`, { method: 'POST', body: JSON.stringify(data) });
      modalOverlay.classList.remove('open');
      window.frankyToast && window.frankyToast('✓ Invitation sent');
      load();
    } catch (err) {
      FrankyAuth.showAlert(alertEl, err.message);
    } finally {
      FrankyAuth.setLoading(saveBtn, false);
    }
  });

  (async function init() {
    const ctx = await AppShell.init('team.html');
    if (!ctx) return;
    businessId = ctx.businessId;
    load();
  })();
})();
