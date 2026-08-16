/**
 * FRANKY TECH — Tests: Slug Generation
 * -----------------------------------------------------------
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { baseSlugify } = require('../server/utils/slug');

test('baseSlugify lowercases and hyphenates', () => {
  assert.equal(baseSlugify('Granny\'s Pies'), 'granny-s-pies');
});

test('baseSlugify strips leading/trailing hyphens', () => {
  assert.equal(baseSlugify('  --Hello World--  '), 'hello-world');
});

test('baseSlugify handles empty input without crashing', () => {
  assert.equal(baseSlugify(''), 'business');
});

test('baseSlugify collapses repeated special characters', () => {
  assert.equal(baseSlugify('A///B***C'), 'a-b-c');
});
