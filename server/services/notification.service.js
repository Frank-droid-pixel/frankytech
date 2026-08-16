/**
 * FRANKY TECH — Notification Service
 * -----------------------------------------------------------
 * The single entry point other services call to raise an
 * in-app notification (Phase 20), so every trigger from the
 * Automation Engine (Phase 21) funnels through one place.
 * -----------------------------------------------------------
 */
const notificationModel = require('../models/notification.model');

async function notify(businessId, { type, title, message, link, userId, dedupeHours }) {
  if (dedupeHours) {
    const recentExists = await notificationModel.existsRecentOfType(businessId, type, dedupeHours);
    if (recentExists) return null;
  }
  return notificationModel.create({ businessId, userId, type, title, message, link });
}

async function listForBusiness(businessId) {
  const [items, unread] = await Promise.all([
    notificationModel.listForBusiness(businessId),
    notificationModel.unreadCount(businessId),
  ]);
  return { items, unread };
}

async function markRead(businessId, id) {
  return notificationModel.markRead(businessId, id);
}

async function markAllRead(businessId) {
  return notificationModel.markAllRead(businessId);
}

module.exports = { notify, listForBusiness, markRead, markAllRead };
