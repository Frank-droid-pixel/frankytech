const express = require('express');
const router = express.Router();
const controller = require('../controllers/report.controller');
const { requireAuth, requireBusiness } = require('../middleware/auth.middleware');

router.use(requireAuth, requireBusiness);
router.get('/profit-and-loss', controller.profitAndLoss);
router.get('/sales', controller.sales);
router.get('/customers', controller.customers);
router.get('/invoices', controller.invoices);

module.exports = router;
