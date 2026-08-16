const express = require('express');
const router = express.Router();
const controller = require('../controllers/customer.controller');
const { requireAuth, requireBusiness } = require('../middleware/auth.middleware');

router.use(requireAuth, requireBusiness);
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.get);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
