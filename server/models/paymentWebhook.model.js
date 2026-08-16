const { query } = require('../config/db');

async function logEvent({ provider, signatureValid, payload, error }) {
  const { rows } = await query(
    `INSERT INTO payment_webhook_events (provider, signature_valid, payload, error, processed_at)
     VALUES ($1,$2,$3,$4, CASE WHEN $2 THEN now() ELSE NULL END) RETURNING *`,
    [provider || 'generic', !!signatureValid, payload ? JSON.stringify(payload) : null, error || null]
  );
  return rows[0];
}

module.exports = { logEvent };
