/**
 * FRANKY TECH — Audit Logging (Phase 25)
 * -----------------------------------------------------------
 * Single entry point for writing to audit_logs (created back
 * in migration 0001, unused until now). Always fire-and-forget
 * from the caller's perspective — a logging failure must never
 * break the action being logged.
 * -----------------------------------------------------------
 */
const { query } = require('../config/db');

async function log({ userId, businessId, action, resource, metadata, ipAddress }) {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, business_id, action, resource, metadata, ip_address)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [userId || null, businessId || null, action, resource || null, metadata ? JSON.stringify(metadata) : null, ipAddress || null]
    );
  } catch (err) {
    console.error('[FRANKY TECH] audit log failed:', err.message);
  }
}

module.exports = { log };
