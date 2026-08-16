
/**
 * FRANKY TECH — Security Middleware
 * -----------------------------------------------------------
 * Baseline security hardening applied to every request.
 *
 * IMPORTANT:
 * This CSP is designed for the FRANKY TECH architecture:
 * - External JavaScript files from the same origin
 * - Google Fonts
 * - Dynamically loaded page templates
 * - Same-origin API requests
 *
 * Route-specific rate limits can be added separately.
 * -----------------------------------------------------------
 */

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');


/* =========================================================
   HELMET — SECURITY HEADERS
   ========================================================= */

const helmetMiddleware = helmet({

  contentSecurityPolicy: {

    directives: {

      /* Only allow resources from our own domain by default */
      defaultSrc: ["'self'"],


      /* Google Fonts CSS */
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com'
      ],


      /* Google Fonts files */
      fontSrc: [
        "'self'",
        'https://fonts.gstatic.com',
        'data:'
      ],


      /* Images */
      imgSrc: [
        "'self'",
        'data:',
        'blob:'
      ],


      /*
       * JavaScript must come from our own server.
       *
       * Your files such as:
       * /js/auth.js
       * /js/app-shell.js
       * /js/customers.js
       * /js/products.js
       * /js/reports.js
       *
       * are therefore allowed.
       */
      scriptSrc: [
        "'self'"
      ],


      /*
       * JavaScript/API requests.
       *
       * This allows:
       *
       * fetch('/api/...')
       *
       * XMLHttpRequest
       *
       * WebSocket connections to the same origin.
       */
      connectSrc: [
        "'self'"
      ],


      /* Prevent plugins such as Flash */
      objectSrc: [
        "'none'"
      ],


      /* Restrict <base> */
      baseUri: [
        "'self'"
      ],


      /* Prevent other websites from embedding FRANKY TECH */
      frameAncestors: [
        "'self'"
      ],


      /* Forms may submit only to our own origin */
      formAction: [
        "'self'"
      ],


      /*
       * Prevent workers from loading arbitrary resources.
       */
      workerSrc: [
        "'self'",
        'blob:'
      ]

    }
  },


  /*
   * Some parts of FRANKY TECH may use images/resources
   * that would otherwise conflict with COEP.
   */
  crossOriginEmbedderPolicy: false

});


/* =========================================================
   CORS
   ========================================================= */

const corsMiddleware = cors({

  /*
   * In production:
   *
   * APP_URL=https://your-domain.com
   *
   * Only that origin will be allowed.
   *
   * For development, localhost can be used.
   */
  origin: process.env.APP_URL || true,

  /*
   * Needed if your authentication uses cookies/sessions.
   */
  credentials: true

});


/* =========================================================
   GENERAL API RATE LIMITER
   ========================================================= */

const generalApiLimiter = rateLimit({

  windowMs: 15 * 60 * 1000,

  /*
   * Maximum requests per IP during the window.
   */
  max: 300,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    error:
      'Too many requests. Please try again later.'
  }

});


/* =========================================================
   AUTHENTICATION RATE LIMITER
   ========================================================= */

const authLimiter = rateLimit({

  windowMs: 15 * 60 * 1000,

  /*
   * Login/register/password-reset endpoints.
   */
  max: 20,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    error:
      'Too many attempts. Please wait a few minutes and try again.'
  }

});


/* =========================================================
   PUBLIC WRITE RATE LIMITER
   ========================================================= */

const publicWriteLimiter = rateLimit({

  windowMs: 15 * 60 * 1000,

  /*
   * Public review submissions and similar endpoints.
   */
  max: 10,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    error:
      'Too many submissions. Please wait a few minutes and try again.'
  }

});


/* =========================================================
   EXPORTS
   ========================================================= */

module.exports = {

  helmetMiddleware,

  corsMiddleware,

  generalApiLimiter,

  authLimiter,

  publicWriteLimiter

};