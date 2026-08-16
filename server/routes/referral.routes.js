const express = require('express');
const router = express.Router();
const controller = require('../controllers/referral.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/dashboard', requireAuth, controller.dashboard);

module.exports = router;
