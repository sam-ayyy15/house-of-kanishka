import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isNewAccount, NEW_ACCOUNT_MS } from '../lib/new-account.ts';

const now = Date.parse('2026-11-18T10:00:00Z');

test('an account made moments ago is new ("Welcome to the house")', () => {
  assert.equal(isNewAccount(now - 5_000, now), true);
  assert.equal(isNewAccount(new Date(now - 9 * 60_000).toISOString(), now), true);
});

test('an older account is welcomed back', () => {
  assert.equal(isNewAccount(now - NEW_ACCOUNT_MS, now), false);
  assert.equal(isNewAccount('2026-11-01T08:00:00Z', now), false);
});

test('missing or broken dates count as returning, never as new', () => {
  for (const bad of [null, undefined, 'not a date']) assert.equal(isNewAccount(bad, now), false, String(bad));
});
