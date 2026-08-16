/**
 * FRANKY TECH — Auth Validators
 * -----------------------------------------------------------
 * Manual, dependency-free input validation. Every rule here
 * mirrors what the frontend forms already enforce, but the
 * server NEVER trusts client-side validation alone.
 * -----------------------------------------------------------
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegistration(body) {
  const errors = {};
  const { fullName, email, phone, country, password, confirmPassword } = body || {};

  if (!fullName || String(fullName).trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.';
  }
  if (!email || !EMAIL_RE.test(String(email).trim())) {
    errors.email = 'A valid email address is required.';
  }
  if (!password || String(password).length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }
  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  if (phone && String(phone).length > 30) {
    errors.phone = 'Phone number is too long.';
  }
  if (country && String(country).length > 100) {
    errors.country = 'Country is too long.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

function validateLogin(body) {
  const errors = {};
  const { email, password } = body || {};
  if (!email || !EMAIL_RE.test(String(email).trim())) errors.email = 'A valid email address is required.';
  if (!password) errors.password = 'Password is required.';
  return { valid: Object.keys(errors).length === 0, errors };
}

function validatePasswordReset(body) {
  const errors = {};
  const { password, confirmPassword } = body || {};
  if (!password || String(password).length < 8) errors.password = 'Password must be at least 8 characters.';
  if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
  return { valid: Object.keys(errors).length === 0, errors };
}

module.exports = { validateRegistration, validateLogin, validatePasswordReset, EMAIL_RE };
