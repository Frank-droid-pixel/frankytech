/**
 * FRANKY TECH — API Route Foundation
 * -----------------------------------------------------------
 * Phase 1 only wires up a health check. Each feature area
 * listed in the master spec (auth, businesses, customers,
 * invoices, etc.) will get its own router file mounted here
 * in its corresponding phase, e.g.:
 *
 *   router.use('/auth', require('./auth.routes'));
 *   router.use('/customers', require('./customers.routes'));
 * -----------------------------------------------------------
 */

const express = require('express');
const router = express.Router();
const { checkConnection } = require('../config/db');

// GET /api/health
router.get('/health', async (req, res) => {
  const db = await checkConnection();
  res.json({
    status: 'ok',
    service: 'FRANKY TECH API',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    database: db,
  });
});

// GET /api/config/public — safe, non-secret values the frontend needs
router.get('/config/public', (req, res) => {
  res.json({
    whatsappNumber: process.env.WHATSAPP_NUMBER || null,
    social: {
      facebook: process.env.FACEBOOK_URL || null,
      tiktok: process.env.TIKTOK_URL || null,
      instagram: process.env.INSTAGRAM_URL || null,
      youtube: process.env.YOUTUBE_URL || null,
    },
  });
});

// --- Feature routers (each phase adds its own file here) ---
router.use('/auth', require('./auth.routes'));
router.use('/businesses', require('./business.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/customers', require('./customer.routes'));
router.use('/items', require('./item.routes'));
router.use('/invoices', require('./invoice.routes'));
router.use('/quotations', require('./quotation.routes'));
router.use('/receipts', require('./receipt.routes'));
router.use('/expenses', require('./expense.routes'));
router.use('/reports', require('./report.routes'));
router.use('/reviews', require('./review.routes'));
router.use('/referrals', require('./referral.routes'));
router.use('/subscriptions', require('./subscription.routes'));
router.use('/shares', require('./share.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/team', require('./team.routes'));
router.use('/support', require('./support.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/feedback', require('./feedback.routes'));
router.use('/public', require('./public.routes'));

module.exports = router;
