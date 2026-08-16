/**
 * FRANKY TECH — Password Hashing
 * -----------------------------------------------------------
 * Uses Node's built-in crypto.scrypt (a memory-hard KDF —
 * the same family of algorithm as bcrypt/Argon2, and an
 * OWASP-accepted alternative) so Phase 1–3 have zero extra
 * native dependencies to compile on any host.
 *
 * Passwords are NEVER stored or logged in plain text.
 * -----------------------------------------------------------
 */

const crypto = require('crypto');

const KEY_LENGTH = 64;
const SALT_BYTES = 16;

function hashPassword(plainPassword) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(SALT_BYTES).toString('hex');
    crypto.scrypt(plainPassword, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

function verifyPassword(plainPassword, storedHash) {
  return new Promise((resolve, reject) => {
    const [salt, key] = String(storedHash || '').split(':');
    if (!salt || !key) return resolve(false);
    crypto.scrypt(plainPassword, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) return reject(err);
      const keyBuffer = Buffer.from(key, 'hex');
      if (keyBuffer.length !== derivedKey.length) return resolve(false);
      resolve(crypto.timingSafeEqual(keyBuffer, derivedKey));
    });
  });
}

module.exports = { hashPassword, verifyPassword };
