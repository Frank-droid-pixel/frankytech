/**
 * FRANKY TECH — Admin Routes  (/api/admin)  — Phase 24
 * -----------------------------------------------------------
 * Every route here requires requireAdmin — a completely
 * separate gate from business roles (owner/admin/etc). A
 * business admin is NOT a platform admin.
 * -----------------------------------------------------------
 */
const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');

router.use(requireAuth, requireAdmin);

router.get('/stats', controller.stats);

router.get('/users', controller.listUsers);
router.get('/users/:id', controller.userDetail);
router.post('/users/:id/suspend', controller.suspendUser);
router.post('/users/:id/activate', controller.activateUser);

router.get('/reviews', controller.reviewsForModeration);

router.get('/feedback', controller.feedback);
router.patch('/feedback/:id/status', controller.updateFeedbackStatus);

router.get('/plans', controller.plans);
router.patch('/plans/:id', controller.updatePlan);

router.get('/announcements', controller.announcements);
router.post('/announcements', controller.createAnnouncement);
router.patch('/announcements/:id/active', controller.setAnnouncementActive);

router.get('/audit-logs', controller.auditLogs);

module.exports = router;
