const express = require('express');
const router = express.Router();
const controller = require('../controllers/quotation.controller');
const { requireAuth, requireBusiness } = require('../middleware/auth.middleware');

router.use(requireAuth, requireBusiness);
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.get);
router.get('/:id/pdf', controller.pdf);
router.patch('/:id/status', controller.updateStatus);
router.post('/:id/convert', controller.convert);

module.exports = router;
