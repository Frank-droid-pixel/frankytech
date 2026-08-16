/**
 * FRANKY TECH — Tests: Password Hashing
 * -----------------------------------------------------------
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { hashPassword, verifyPassword } = require('../server/utils/password');

test('hashPassword never returns the plain password', async () => {
  const hash = await hashPassword('DemoPass123!');
  assert.notEqual(hash, 'DemoPass123!');
  assert.match(hash, /^[a-f0-9]+:[a-f0-9]+$/); // salt:hash hex format
});

test('hashPassword produces a different hash each time (random salt)', async () => {
  const hash1 = await hashPassword('DemoPass123!');
  const hash2 = await hashPassword('DemoPass123!');
  assert.notEqual(hash1, hash2);
});

test('verifyPassword returns true for the correct password', async () => {
  const hash = await hashPassword('DemoPass123!');
  const result = await verifyPassword('DemoPass123!', hash);
  assert.equal(result, true);
});

test('verifyPassword returns false for the wrong password', async () => {
  const hash = await hashPassword('DemoPass123!');
  const result = await verifyPassword('WrongPassword!', hash);
  assert.equal(result, false);
});

test('verifyPassword returns false (not throws) on a malformed stored hash', async () => {
  const result = await verifyPassword('anything', 'not-a-valid-hash');
  assert.equal(result, false);
});
