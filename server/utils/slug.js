/**
 * FRANKY TECH — Slug Utility
 * -----------------------------------------------------------
 * Generates a unique, URL-safe slug for a business's public
 * profile (/business/:slug — implemented in a later phase).
 * -----------------------------------------------------------
 */

function baseSlugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'business';
}

async function slugify(pool, name) {
  const base = baseSlugify(name);
  let candidate = base;
  let suffix = 0;

  // Loop until we find a slug that isn't taken. Bounded to avoid
  // any theoretical infinite loop on pathological input.
  for (let attempts = 0; attempts < 50; attempts += 1) {
    const { rows } = await pool.query('SELECT 1 FROM businesses WHERE slug = $1', [candidate]);
    if (rows.length === 0) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return `${base}-${Date.now()}`;
}

module.exports = { slugify, baseSlugify };
