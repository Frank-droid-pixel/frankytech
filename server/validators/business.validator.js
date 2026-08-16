/**
 * FRANKY TECH — Business Validators
 * -----------------------------------------------------------
 */

const ALLOWED_CURRENCIES = ['XAF', 'USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD', 'ZAR', 'GHS', 'KES', 'AED', 'CHF', 'JPY', 'CNY'];

function validateBusinessCreate(body) {
  const errors = {};
  const { name, currency } = body || {};

  if (!name || String(name).trim().length < 2) {
    errors.name = 'Business name must be at least 2 characters.';
  }
  if (currency && !ALLOWED_CURRENCIES.includes(String(currency).toUpperCase())) {
    errors.currency = `Currency must be one of: ${ALLOWED_CURRENCIES.join(', ')}.`;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

module.exports = { validateBusinessCreate, ALLOWED_CURRENCIES };
