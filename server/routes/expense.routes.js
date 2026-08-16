const express = require('express');
const router = express.Router();
const controller = require('../controllers/expense.controller');
const { requireAuth, requireBusiness } = require('../middleware/auth.middleware');

router.use(requireAuth, requireBusiness);
router.get('/', controller.list);
router.post('/', controller.create);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
