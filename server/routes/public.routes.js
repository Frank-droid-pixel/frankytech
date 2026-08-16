/**
 * FRANKY TECH — Public Routes (no authentication)
 * -----------------------------------------------------------
 * Everything mounted here is intentionally reachable without a
 * session cookie: customer portal document links, public review
 * submission, a business's public review list, referral click
 * tracking, and the payment gateway webhook. Each handler is
 * still scoped to exactly one record via an unguessable token —
 * never by a sequential ID — per the platform's "never expose
 * sequential private IDs as public access tokens" rule.
 * -----------------------------------------------------------
 */
const express = require('express');
const router = express.Router();

const shareController = require('../controllers/share.controller');
const reviewController = require('../controllers/review.controller');
const referralController = require('../controllers/referral.controller');
const paymentGatewayController = require('../controllers/paymentGateway.controller');
const { generalApiLimiter, authLimiter, publicWriteLimiter } = require('../middleware/security');

// --- Customer portal (secure share links) ---
router.get('/share/:token', shareController.publicGet);
router.get('/share/:token/pdf', shareController.publicPdf);

// --- Public review submission ---
router.get('/reviews/request/:token', reviewController.publicGetRequest);
router.post('/reviews/request/:token', publicWriteLimiter, reviewController.publicSubmit);
router.get('/reviews/business/:businessId', reviewController.publicBusinessReviews);

// --- Referral click tracking ---
router.get('/referrals/click/:code', publicWriteLimiter, referralController.trackClick);

// --- Payment gateway webhook (Phase 19) ---
router.post('/webhooks/payment', paymentGatewayController.webhook);

module.exports = router;
