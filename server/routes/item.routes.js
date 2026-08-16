const express = require('express');
const router = express.Router();
const controller = require('../controllers/item.controller');
const { requireAuth, requireBusiness } = require('../middleware/auth.middleware');

router.use(requireAuth, requireBusiness);
router.get('/low-stock', controller.lowStock);
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.get);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);
router.post('/:id/adjust-stock', controller.adjustStock);

module.exports = router;
