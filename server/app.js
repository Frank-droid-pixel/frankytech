/**
 * FRANKY TECH — Express Application
 * -----------------------------------------------------------
 * Assembles middleware, static frontend, and API routes.
 * Kept deliberately small: each concern lives in its own file
 * under server/middleware, server/routes, server/config, etc.,
 * so this file never becomes "one giant JavaScript file."
 * -----------------------------------------------------------
 */

const path = require('path');
const express = require('express');
const morgan = require('morgan');
const compression = require('compression');

const { helmetMiddleware, corsMiddleware, generalApiLimiter } = require('./middleware/security');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { attachSession } = require('./middleware/auth.middleware');
const { verifyCsrf } = require('./utils/csrf');
const apiRoutes = require('./routes');

const app = express();

// --- Core parsing ---
// Captures the raw request body (req.rawBody) alongside the parsed
// JSON, which the payment webhook handler needs for HMAC signature
// verification — see server/services/paymentGateway.service.js.
app.use(express.json({ limit: '2mb', verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// --- Security ---
app.use(helmetMiddleware);
app.use(corsMiddleware);

// --- Performance (Phase 27): gzip/brotli-negotiated compression for
//     every response — HTML, JSON, CSS, JS. PDFs are already compressed
//     binary so this passes them through with minimal overhead. ---
app.use(compression());

// --- Logging ---
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// --- Resolve the session (if any), enforce CSRF on state-changing
//     requests, then mount API ---
app.use('/api', generalApiLimiter, attachSession, verifyCsrf, apiRoutes);

// --- Static frontend (client/) ---
const clientDir = path.join(__dirname, '..', 'client');
app.use(
  express.static(clientDir, {
    extensions: ['html'],
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  })
);

// Fallback to the landing page for any unknown non-API GET route.
// (Later phases can replace this with proper client-side routing rules.)
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) return next();
  res.sendFile(path.join(clientDir, 'index.html'));
});

// --- 404 + centralized error handling (must be last) ---
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
