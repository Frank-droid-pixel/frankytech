/**
 * FRANKY TECH — Tests: Input Validators
 * -----------------------------------------------------------
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateRegistration, validateLogin } = require('../server/validators/auth.validator');
const { validateBusinessCreate } = require('../server/validators/business.validator');

test('validateRegistration rejects a too-short password', () => {
  const { valid, errors } = validateRegistration({
    fullName: 'Jane Doe', email: 'jane@example.com', password: 'short', confirmPassword: 'short',
  });
  assert.equal(valid, false);
  assert.ok(errors.password);
});

test('validateRegistration rejects mismatched passwords', () => {
  const { valid, errors } = validateRegistration({
    fullName: 'Jane Doe', email: 'jane@example.com', password: 'LongEnough1', confirmPassword: 'Different1',
  });
  assert.equal(valid, false);
  assert.ok(errors.confirmPassword);
});

test('validateRegistration rejects an invalid email', () => {
  const { valid, errors } = validateRegistration({
    fullName: 'Jane Doe', email: 'not-an-email', password: 'LongEnough1', confirmPassword: 'LongEnough1',
  });
  assert.equal(valid, false);
  assert.ok(errors.email);
});

test('validateRegistration accepts well-formed input', () => {
  const { valid, errors } = validateRegistration({
    fullName: 'Jane Doe', email: 'jane@example.com', password: 'LongEnough1', confirmPassword: 'LongEnough1',
  });
  assert.equal(valid, true);
  assert.deepEqual(errors, {});
});

test('validateLogin requires both email and password', () => {
  const { valid, errors } = validateLogin({ email: '', password: '' });
  assert.equal(valid, false);
  assert.ok(errors.email);
  assert.ok(errors.password);
});

test('validateBusinessCreate rejects a 1-character name', () => {
  const { valid, errors } = validateBusinessCreate({ name: 'X' });
  assert.equal(valid, false);
  assert.ok(errors.name);
});

test('validateBusinessCreate rejects an unsupported currency', () => {
  const { valid, errors } = validateBusinessCreate({ name: 'My Shop', currency: 'ZZZ' });
  assert.equal(valid, false);
  assert.ok(errors.currency);
});

test('validateBusinessCreate accepts a valid business', () => {
  const { valid } = validateBusinessCreate({ name: 'My Shop', currency: 'USD' });
  assert.equal(valid, true);
});
