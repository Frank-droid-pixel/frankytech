/**
 * FRANKY TECH — Platform Feedback Controller
 * User-facing endpoint to submit feedback about FRANKY TECH
 * itself (Phase 49). Admin-side viewing/status is in admin.controller.js.
 */
const { query } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

async function submit(req, res, next) {
  try {
    const { type, rating, message } = req.body;
    if (!message || String(message).trim().length < 3) {
      throw new AppError('Please write a short message.', 422, { message: 'Required, at least 3 characters.' });
    }
    const allowedTypes = ['feature_request', 'bug_report', 'complaint', 'suggestion', 'general'];
    const safeType = allowedTypes.includes(type) ? type : 'general';

    const { rows } = await query(
      `INSERT INTO platform_feedback (user_id, type, rating, message) VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.session.user.id, safeType, rating || null, message]
    );
    res.status(201).json({ feedback: rows[0] });
  } catch (err) { next(err); }
}

module.exports = { submit };
