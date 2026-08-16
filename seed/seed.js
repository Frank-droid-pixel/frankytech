/**
 * FRANKY TECH — Development Seed Data
 * -----------------------------------------------------------
 * Creates ONE demo user + business so you can log in and see
 * a populated dashboard immediately after setup.
 *
 * Per the platform rules, seed/demo data only ever runs in
 * development — never point this at a production database.
 *
 * Usage: npm run seed
 * -----------------------------------------------------------
 */

require('dotenv').config();
const { pool } = require('../server/config/db');
const { hashPassword } = require('../server/utils/password');
const { generateReferralCode } = require('../server/utils/token');
const { slugify } = require('../server/utils/slug');

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    console.error('[seed] Refusing to seed a production environment.');
    process.exit(1);
  }
  if (!pool) {
    console.error('[seed] DATABASE_URL is not set. Configure your .env file first.');
    process.exit(1);
  }

  const email = 'demo@frankytech.test';
  const password = 'DemoPass123!';

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length) {
    console.log(`[seed] Demo user already exists: ${email}`);
    await pool.end();
    return;
  }

  const passwordHash = await hashPassword(password);
  const referralCode = generateReferralCode('DEMO');

  const userResult = await pool.query(
    `INSERT INTO users (full_name, email, phone, country, password_hash, referral_code, email_verified_at)
     VALUES ($1, $2, $3, $4, $5, $6, now())
     RETURNING id`,
    ['Demo Owner', email, '+237670113284', 'Cameroon', passwordHash, referralCode]
  );
  const userId = userResult.rows[0].id;

  const businessName = "Demo Business";
  const slug = await slugify(pool, businessName);

  const businessResult = await pool.query(
    `INSERT INTO businesses (owner_id, name, slug, business_type, country, currency, onboarding_completed_at)
     VALUES ($1, $2, $3, $4, $5, $6, now())
     RETURNING id`,
    [userId, businessName, slug, 'Retail', 'Cameroon', 'XAF']
  );
  const businessId = businessResult.rows[0].id;

  await pool.query(
    `INSERT INTO business_members (business_id, user_id, role) VALUES ($1, $2, 'owner')`,
    [businessId, userId]
  );

  console.log('[seed] Demo account created:');
  console.log(`        email:    ${email}`);
  console.log(`        password: ${password}`);
  console.log('[seed] Use these credentials on /login.html to explore the dashboard.');

  await pool.end();
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
