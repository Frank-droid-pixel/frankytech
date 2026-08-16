/**
 * FRANKY TECH — Database Connection
 * -----------------------------------------------------------
 * Centralized PostgreSQL connection pool.
 * All future models/services should import `query` or `pool`
 * from this file rather than creating new connections.
 * -----------------------------------------------------------
 */

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // We don't crash the whole app in Phase 1 (the landing page must still
  // load even before a database is configured), but we log loudly so
  // it's impossible to miss during setup.
  console.warn(
    '[FRANKY TECH] WARNING: DATABASE_URL is not set. Database-backed ' +
      'features will not work until it is configured in your .env file.'
  );
}

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  : null;

if (pool) {
  pool.on('error', (err) => {
    // Unexpected error on an idle client — log, don't crash the process.
    console.error('[FRANKY TECH] Unexpected database error:', err.message);
  });
}

/**
 * Run a parameterized query against the database.
 * Always use parameterized queries ($1, $2, ...) — never string-concatenate
 * user input into SQL, to prevent SQL injection.
 */
async function query(text, params) {
  if (!pool) {
    throw new Error(
      'Database is not configured. Set DATABASE_URL in your .env file.'
    );
  }
  return pool.query(text, params);
}

/**
 * Simple connectivity check used by the health check route.
 */
async function checkConnection() {
  if (!pool) return { connected: false, reason: 'DATABASE_URL not set' };
  try {
    await pool.query('SELECT 1');
    return { connected: true };
  } catch (err) {
    return { connected: false, reason: err.message };
  }
}

module.exports = { pool, query, checkConnection };
