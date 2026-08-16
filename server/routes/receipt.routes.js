const express = require('express');
const router = express.Router();
const controller = require('../controllers/payment.controller');
const { requireAuth, requireBusiness } = require('../middleware/auth.middleware');

router.use(requireAuth, requireBusiness);
router.get('/', controller.listReceipts);
router.get('/:id', controller.getReceipt);
router.get('/:id/pdf', controller.receiptPdf);

module.exports = router;
