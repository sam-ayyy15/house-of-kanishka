import assert from 'node:assert/strict';
import { test } from 'node:test';
import { INDIAN_STATES, indianMobile, PINCODE } from '../lib/india.ts';

test('Indian mobile numbers are normalised to 10 digits', () => {
  assert.equal(indianMobile('9876543210'), '9876543210');
  assert.equal(indianMobile('+91 98765 43210'), '9876543210');
  assert.equal(indianMobile('098765-43210'), '9876543210');
  assert.equal(indianMobile('919876543210'), '9876543210');
});

test('numbers that are not Indian mobiles are refused', () => {
  for (const bad of ['', '12345', '5876543210', '98765432101', '+1 415 555 0100', 'abcdefghij']) {
    assert.equal(indianMobile(bad), null, bad);
  }
});

test('PIN codes are six digits and never start with 0', () => {
  assert.ok(PINCODE.test('400001'));
  for (const bad of ['040001', '40001', '4000011', '4000a1']) assert.ok(!PINCODE.test(bad), bad);
});

test('all 28 states and 8 union territories are listed once', () => {
  assert.equal(INDIAN_STATES.length, 36);
  assert.equal(new Set(INDIAN_STATES).size, 36);
});
