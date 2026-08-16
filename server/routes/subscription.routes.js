const express = require('express');
const router = express.Router();
const controller = require('../controllers/subscription.controller');
const { requireAuth, requireBusiness, requireRole } = require('../middleware/auth.middleware');

router.get('/plans', controller.listPlans); // public pricing data, no auth needed
router.get('/current', requireAuth, requireBusiness, controller.current);
router.post('/change', requireAuth, requireBusiness, requireRole('owner', 'admin'), controller.changePlan);

module.exports = router;
