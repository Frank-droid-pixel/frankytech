/**
 * FRANKY TECH — Centralized Error Handling
 * -----------------------------------------------------------
 * All routes/controllers should call next(err) on failure.
 * This is the single place that decides what the client sees.
 * Never leak stack traces, SQL, or secrets in production.
 * -----------------------------------------------------------
 */

class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

function notFoundHandler(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Always log the full error server-side.
  console.error(`[FRANKY TECH] ${req.method} ${req.originalUrl} ->`, err);

  const payload = {
    error: {
      message:
        !isProduction || err.isOperational
          ? err.message
          : 'Something went wrong. Please try again later.',
    },
  };

  // Field-level validation details are safe to expose even in production —
  // they were deliberately attached by our own AppError, never raw
  // internals. Stack traces are dev-only.
  if (err.isOperational && err.details) payload.error.details = err.details;
  if (!isProduction) payload.error.stack = err.stack;

  res.status(statusCode).json(payload);
}

module.exports = { AppError, notFoundHandler, errorHandler };
