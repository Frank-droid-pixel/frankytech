(function () {
  let businessId = null;
  let currentUserId = null;
  let currentTicketId = null;

  const ticketListView = document.getElementById('ticketListView');
  const ticketThreadView = document.getElementById('ticketThreadView');
  const ticketsBody = document.getElementById('ticketsBody');
  const emptyState = document.getElementById('emptyState');
  const newTicketBtn = document.getElementById('newTicketBtn');
  const backToListBtn = document.getElementById('backToListBtn');

  const modalOverlay = document.getElementById('modalOverlay');
  const modalClose = document.getElementById('modalClose');
  const form = document.getElementById('ticketForm');
  const alertEl = document.getElementById('formAlert');
  const saveBtn = document.getElementById('saveBtn');

  const threadSubject = document.getElementById('threadSubject');
  const threadStatus = document.getElementById('threadStatus');
  const threadMessages = document.getElementById('threadMessages');
  const replyForm = document.getElementById('replyForm');
  const replyBtn = document.getElementById('replyBtn');

  function showList() { ticketListView.style.display = 'block'; ticketThreadView.style.display = 'none'; loadList(); }
  function showThread(id) { currentTicketId = id; ticketListView.style.display = 'none'; ticketThreadView.style.display = 'block'; loadThread(); }

  async function loadList() {
    const { tickets } = await FrankyAuth.api(`/api/support?businessId=${businessId}`);
    if (tickets.length === 0) { ticketsBody.innerHTML = ''; emptyState.style.display = 'block'; return; }
    emptyState.style.display = 'none';
    ticketsBody.innerHTML = tickets.map((t) => `
      <tr>
        <td><span class="row-link" data-open="${t.id}">${FrankyAuth.escapeHtml(t.subject)}</span></td>
        <td>${t.priority}</td>
        <td><span class="badge badge-${t.status === 'resolved' || t.status === 'closed' ? 'paid' : 'sent'}">${t.status.replace('_', ' ')}</span></td>
        <td>${new Date(t.updated_at).toLocaleDateString()}</td>
      </tr>`).join('');
    ticketsBody.querySelectorAll('[data-open]').forEach((el) => el.addEventListener('click', () => showThread(el.dataset.open)));
  }

  async function loadThread() {
    const { ticket } = await FrankyAuth.api(`/api/support/${currentTicketId}?businessId=${businessId}`);
    threadSubject.textContent = ticket.subject;
    threadStatus.textContent = ticket.status.replace('_', ' ');
    threadStatus.className = `badge badge-${ticket.status === 'resolved' || ticket.status === 'closed' ? 'paid' : 'sent'}`;
    threadMessages.innerHTML = ticket.messages.map((m) => `
      <div style="align-self:${m.sender_type === 'support' ? 'flex-start' : 'flex-end'}; max-width:75%; background:${m.sender_type === 'support' ? 'var(--surface-secondary)' : 'var(--primary)'}; color:${m.sender_type === 'support' ? 'var(--text)' : '#fff'}; padding:10px 14px; border-radius:var(--radius-sm);">
        <div style="font-size:var(--small);">${FrankyAuth.escapeHtml(m.message)}</div>
        <div style="font-size:var(--caption); opacity:0.7; margin-top:4px;">${new Date(m.created_at).toLocaleString()}</div>
      </div>`).join('');
    replyForm.style.display = ticket.status === 'closed' ? 'none' : 'block';
  }

  backToListBtn.addEventListener('click', showList);

  newTicketBtn.addEventListener('click', () => { form.reset(); FrankyAuth.hideAlert(alertEl); modalOverlay.classList.add('open'); });
  modalClose.addEventListener('click', () => modalOverlay.classList.remove('open'));
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) modalOverlay.classList.remove('open'); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    FrankyAuth.hideAlert(alertEl);
    FrankyAuth.setLoading(saveBtn, true);
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const { ticket } = await FrankyAuth.api(`/api/support?businessId=${businessId}`, { method: 'POST', body: JSON.stringify(data) });
      modalOverlay.classList.remove('open');
      window.frankyToast && window.frankyToast('✓ Ticket opened');
      showThread(ticket.id);
    } catch (err) {
      FrankyAuth.showAlert(alertEl, err.message);
    } finally {
      FrankyAuth.setLoading(saveBtn, false);
    }
  });

  replyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    FrankyAuth.setLoading(replyBtn, true);
    const message = document.getElementById('replyMessage').value;
    try {
      await FrankyAuth.api(`/api/support/${currentTicketId}/reply?businessId=${businessId}`, { method: 'POST', body: JSON.stringify({ message }) });
      replyForm.reset();
      loadThread();
    } catch (err) {
      alert(err.message);
    } finally {
      FrankyAuth.setLoading(replyBtn, false);
    }
  });

  (async function init() {
    const ctx = await AppShell.init('support.html');
    if (!ctx) return;
    businessId = ctx.businessId;
    currentUserId = ctx.session.user.id;
    showList();
  })();
})();
