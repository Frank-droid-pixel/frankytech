const express = require('express');
const router = express.Router();
const controller = require('../controllers/invoice.controller');
const paymentController = require('../controllers/payment.controller');
const { requireAuth, requireBusiness } = require('../middleware/auth.middleware');

router.use(requireAuth, requireBusiness);
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.get);
router.get('/:id/pdf', controller.pdf);
router.post('/:id/send', controller.markSent);
router.post('/:id/cancel', controller.cancel);

// Payments are nested under their invoice — they only ever make sense
// in the context of a specific invoice's balance.
router.post('/:invoiceId/payments', paymentController.recordPayment);
router.get('/:invoiceId/payments', paymentController.listForInvoice);

module.exports = router;
