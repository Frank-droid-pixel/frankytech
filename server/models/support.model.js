const { query } = require('../config/db');

async function createTicket({ businessId, userId, subject, priority, firstMessage }) {
  const ticketResult = await query(
    `INSERT INTO support_tickets (business_id, user_id, subject, priority) VALUES ($1,$2,$3,$4) RETURNING *`,
    [businessId, userId, subject, priority || 'normal']
  );
  const ticket = ticketResult.rows[0];
  await query(
    `INSERT INTO support_messages (ticket_id, sender_user_id, sender_type, message) VALUES ($1,$2,'user',$3)`,
    [ticket.id, userId, firstMessage]
  );
  return ticket;
}

async function listForBusiness(businessId) {
  const { rows } = await query(
    `SELECT t.*, (SELECT COUNT(*) FROM support_messages WHERE ticket_id = t.id)::int AS message_count
       FROM support_tickets t WHERE t.business_id = $1 ORDER BY t.updated_at DESC`,
    [businessId]
  );
  return rows;
}

async function findById(businessId, id) {
  const { rows } = await query('SELECT * FROM support_tickets WHERE business_id = $1 AND id = $2', [businessId, id]);
  if (!rows[0]) return null;
  const messages = await query('SELECT * FROM support_messages WHERE ticket_id = $1 ORDER BY created_at ASC', [id]);
  return { ...rows[0], messages: messages.rows };
}

async function addMessage(ticketId, { senderUserId, senderType, message }) {
  const { rows } = await query(
    `INSERT INTO support_messages (ticket_id, sender_user_id, sender_type, message) VALUES ($1,$2,$3,$4) RETURNING *`,
    [ticketId, senderUserId || null, senderType || 'user', message]
  );
  await query('UPDATE support_tickets SET updated_at = now() WHERE id = $1', [ticketId]);
  return rows[0];
}

async function updateStatus(businessId, id, status) {
  const { rows } = await query(
    'UPDATE support_tickets SET status = $3, updated_at = now() WHERE business_id = $1 AND id = $2 RETURNING *',
    [businessId, id, status]
  );
  return rows[0] || null;
}

module.exports = { createTicket, listForBusiness, findById, addMessage, updateStatus };
