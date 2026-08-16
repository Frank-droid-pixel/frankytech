const express = require('express');
const router = express.Router();
const controller = require('../controllers/support.controller');
const { requireAuth, requireBusiness } = require('../middleware/auth.middleware');

router.use(requireAuth, requireBusiness);
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.get);
router.post('/:id/reply', controller.reply);
router.patch('/:id/status', controller.updateStatus);

module.exports = router;
