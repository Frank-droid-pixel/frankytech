/**
 * FRANKY TECH — Admin Controller (Phase 24)
 * -----------------------------------------------------------
 */
const adminService = require('../services/admin.service');
const audit = require('../utils/audit');

async function stats(req, res, next) {
  try { res.json(await adminService.stats()); }
  catch (err) { next(err); }
}

async function listUsers(req, res, next) {
  try {
    const { search, limit, offset } = req.query;
    res.json({ users: await adminService.listUsers({ search, limit: Number(limit) || 50, offset: Number(offset) || 0 }) });
  } catch (err) { next(err); }
}

async function userDetail(req, res, next) {
  try { res.json(await adminService.userDetail(req.params.id)); }
  catch (err) { next(err); }
}

async function suspendUser(req, res, next) {
  try {
    const result = await adminService.suspendUser(req.params.id, req.session.user.id);
    audit.log({ userId: req.session.user.id, action: 'admin.user_suspend', resource: 'users', metadata: { targetUserId: req.params.id }, ipAddress: req.ip });
    res.json({ user: result });
  } catch (err) { next(err); }
}

async function activateUser(req, res, next) {
  try {
    const result = await adminService.activateUser(req.params.id);
    audit.log({ userId: req.session.user.id, action: 'admin.user_activate', resource: 'users', metadata: { targetUserId: req.params.id }, ipAddress: req.ip });
    res.json({ user: result });
  } catch (err) { next(err); }
}

async function reviewsForModeration(req, res, next) {
  try { res.json({ reviews: await adminService.reviewsForModeration(req.query) }); }
  catch (err) { next(err); }
}

async function feedback(req, res, next) {
  try { res.json({ feedback: await adminService.feedback(req.query) }); }
  catch (err) { next(err); }
}

async function updateFeedbackStatus(req, res, next) {
  try { res.json({ feedback: await adminService.updateFeedbackStatus(req.params.id, req.body.status) }); }
  catch (err) { next(err); }
}

async function plans(req, res, next) {
  try { res.json({ plans: await adminService.plans() }); }
  catch (err) { next(err); }
}

async function updatePlan(req, res, next) {
  try {
    const result = await adminService.updatePlan(req.params.id, req.body);
    audit.log({ userId: req.session.user.id, action: 'admin.plan_update', resource: 'subscription_plans', metadata: { planId: req.params.id }, ipAddress: req.ip });
    res.json({ plan: result });
  } catch (err) { next(err); }
}

async function announcements(req, res, next) {
  try { res.json({ announcements: await adminService.announcements() }); }
  catch (err) { next(err); }
}

async function createAnnouncement(req, res, next) {
  try {
    const result = await adminService.createAnnouncement(req.session.user.id, req.body);
    audit.log({ userId: req.session.user.id, action: 'admin.announcement_create', resource: 'platform_announcements', ipAddress: req.ip });
    res.status(201).json({ announcement: result });
  } catch (err) { next(err); }
}

async function setAnnouncementActive(req, res, next) {
  try { res.json({ announcement: await adminService.setAnnouncementActive(req.params.id, req.body.isActive) }); }
  catch (err) { next(err); }
}

async function auditLogs(req, res, next) {
  try { res.json({ logs: await adminService.auditLogs() }); }
  catch (err) { next(err); }
}

module.exports = {
  stats, listUsers, userDetail, suspendUser, activateUser, reviewsForModeration, feedback,
  updateFeedbackStatus, plans, updatePlan, announcements, createAnnouncement, setAnnouncementActive, auditLogs,
};
