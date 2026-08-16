const express = require('express');
const router = express.Router();
const controller = require('../controllers/team.controller');
const { requireAuth, requireBusiness, requireRole } = require('../middleware/auth.middleware');

router.use(requireAuth, requireBusiness);
router.get('/', controller.list);
router.post('/invite', requireRole('owner', 'admin'), controller.invite);
router.patch('/members/:membershipId', requireRole('owner', 'admin'), controller.updateRole);
router.delete('/members/:membershipId', requireRole('owner', 'admin'), controller.remove);
router.delete('/invitations/:id', requireRole('owner', 'admin'), controller.revokeInvitation);

module.exports = router;
