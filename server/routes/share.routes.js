const express = require('express');
const router = express.Router();
const controller = require('../controllers/share.controller');
const { requireAuth, requireBusiness } = require('../middleware/auth.middleware');

router.post('/:docType/:docId', requireAuth, requireBusiness, controller.createLink);
router.delete('/:id', requireAuth, requireBusiness, controller.revoke);

module.exports = router;
