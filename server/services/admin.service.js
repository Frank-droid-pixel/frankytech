/**
 * FRANKY TECH — Admin Service (Phase 24)
 * -----------------------------------------------------------
 */
const adminModel = require('../models/admin.model');
const { AppError } = require('../middleware/errorHandler');

async function stats() {
  return adminModel.platformStats();
}

async function listUsers(query) {
  return adminModel.listUsers(query);
}

async function suspendUser(userId, actingAdminId) {
  if (userId === actingAdminId) throw new AppError('You cannot suspend your own account.', 422);
  const updated = await adminModel.setUserStatus(userId, 'suspended');
  if (!updated) throw new AppError('User not found.', 404);
  return updated;
}

async function activateUser(userId) {
  const updated = await adminModel.setUserStatus(userId, 'active');
  if (!updated) throw new AppError('User not found.', 404);
  return updated;
}

async function userDetail(userId) {
  const businesses = await adminModel.listBusinessesForUser(userId);
  return { businesses };
}

async function reviewsForModeration(query) {
  return adminModel.listReviewsForModeration(query);
}

async function feedback(query) {
  return adminModel.listFeedback(query);
}

async function updateFeedbackStatus(id, status) {
  const allowed = ['new', 'reviewing', 'planned', 'in_progress', 'completed', 'rejected'];
  if (!allowed.includes(status)) throw new AppError('Invalid feedback status.', 422);
  return adminModel.updateFeedbackStatus(id, status);
}

async function plans() {
  return adminModel.listPlans();
}

async function updatePlan(id, fields) {
  const updated = await adminModel.updatePlan(id, fields);
  if (!updated) throw new AppError('Plan not found or no fields to update.', 404);
  return updated;
}

async function announcements() {
  return adminModel.listAnnouncements();
}

async function createAnnouncement(createdBy, { title, body }) {
  if (!title || !body) throw new AppError('Title and body are required.', 422);
  return adminModel.createAnnouncement({ title, body, createdBy });
}

async function setAnnouncementActive(id, isActive) {
  return adminModel.setAnnouncementActive(id, isActive);
}

async function auditLogs() {
  return adminModel.recentAuditLogs();
}

module.exports = {
  stats, listUsers, suspendUser, activateUser, userDetail, reviewsForModeration, feedback,
  updateFeedbackStatus, plans, updatePlan, announcements, createAnnouncement, setAnnouncementActive, auditLogs,
};
