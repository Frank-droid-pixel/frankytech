const express = require('express');
const router = express.Router();
const controller = require('../controllers/feedback.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.post('/', requireAuth, controller.submit);

module.exports = router;
