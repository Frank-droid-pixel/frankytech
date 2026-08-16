/**
 * FRANKY TECH — Migration Runner
 * -----------------------------------------------------------
 * Applies every .sql file in /migrations, in filename order,
 * exactly once. Tracks what has already run in a
 * `schema_migrations` table so it is safe to re-run.
 *
 * Usage: npm run migrate
 * -----------------------------------------------------------
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename    TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function getAppliedMigrations() {
  const { rows } = await pool.query('SELECT filename FROM schema_migrations');
  return new Set(rows.map((r) => r.filename));
}

async function run() {
  if (!pool) {
    console.error('[migrate] DATABASE_URL is not set. Configure your .env file first.');
    process.exit(1);
  }

  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let ranAny = false;

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`[migrate] skip (already applied): ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`[migrate] applied: ${file}`);
      ranAny = true;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`[migrate] FAILED: ${file}`);
      console.error(err);
      process.exit(1);
    } finally {
      client.release();
    }
  }

  if (!ranAny) console.log('[migrate] database already up to date.');
  await pool.end();
}

run();
