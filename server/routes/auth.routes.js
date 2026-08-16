/**
 * FRANKY TECH — Auth Routes  (/api/auth)
 * -----------------------------------------------------------
 */

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/security');

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/logout', authController.logout);
router.get('/me', authController.me);

// Placeholders — implemented fully once email delivery (Phase 20-ish)
// is wired up. Kept here so the frontend can integrate against a
// stable contract without breaking later.
router.post('/verify-email/request', requireAuth, (req, res) => {
  res.status(501).json({ error: { message: 'Email verification is not yet available.' } });
});
router.post('/password/forgot', authLimiter, (req, res) => {
  res.status(501).json({ error: { message: 'Password reset is not yet available.' } });
});
router.post('/password/reset', authLimiter, (req, res) => {
  res.status(501).json({ error: { message: 'Password reset is not yet available.' } });
});

module.exports = router;
