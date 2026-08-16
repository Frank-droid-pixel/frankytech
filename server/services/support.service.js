/**
 * FRANKY TECH — Support Service (Phase 23)
 * -----------------------------------------------------------
 */
const supportModel = require('../models/support.model');
const { AppError } = require('../middleware/errorHandler');

async function createTicket(businessId, userId, { subject, priority, message }) {
  if (!subject || !message) throw new AppError('A subject and message are required.', 422);
  return supportModel.createTicket({ businessId, userId, subject, priority, firstMessage: message });
}

async function listForBusiness(businessId) {
  return supportModel.listForBusiness(businessId);
}

async function getTicket(businessId, id) {
  const ticket = await supportModel.findById(businessId, id);
  if (!ticket) throw new AppError('Support ticket not found.', 404);
  return ticket;
}

async function reply(businessId, id, userId, message) {
  const ticket = await getTicket(businessId, id);
  if (ticket.status === 'closed') throw new AppError('This ticket is closed.', 422);
  return supportModel.addMessage(id, { senderUserId: userId, senderType: 'user', message });
}

async function updateStatus(businessId, id, status) {
  const allowed = ['open', 'in_progress', 'resolved', 'closed'];
  if (!allowed.includes(status)) throw new AppError('Invalid status.', 422);
  return supportModel.updateStatus(businessId, id, status);
}

module.exports = { createTicket, listForBusiness, getTicket, reply, updateStatus };
