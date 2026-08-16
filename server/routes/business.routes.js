/**
 * FRANKY TECH — Business Routes  (/api/businesses)
 * -----------------------------------------------------------
 */

const express = require('express');
const router = express.Router();

const businessController = require('../controllers/business.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.use(requireAuth);

router.get('/', businessController.list);
router.post('/', businessController.create);
router.patch('/:id/onboarding', businessController.updateOnboarding);
router.post('/:id/select', businessController.select);

module.exports = router;
