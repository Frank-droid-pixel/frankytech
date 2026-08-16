const express = require('express');
const router = express.Router();
const controller = require('../controllers/review.controller');
const { requireAuth, requireBusiness } = require('../middleware/auth.middleware');

router.use(requireAuth, requireBusiness);
router.get('/', controller.list);
router.post('/request', controller.requestReview);
router.patch('/:id/status', controller.moderate);
router.post('/:id/respond', controller.respond);

module.exports = router;
