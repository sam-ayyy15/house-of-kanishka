import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loginHref, safeNext } from '../lib/return-to.ts';

test('own-site paths are kept', () => {
  assert.equal(safeNext('/checkout'), '/checkout');
  assert.equal(safeNext('/products/flowing-halter-dress?size=S#details'), '/products/flowing-halter-dress?size=S#details');
});

test('anything that could leave the site falls back to the account page', () => {
  for (const bad of ['https://evil.example/x', '//evil.example', '/\\evil.example', 'javascript:alert(1)', 'evil.example', '', null, undefined]) {
    assert.equal(safeNext(bad), '/account', String(bad));
  }
});

test('the login page and API routes are never a destination', () => {
  assert.equal(safeNext('/login'), '/account');
  assert.equal(safeNext('/login/welcome?next=/x'), '/account');
  assert.equal(safeNext('/api/webhooks/clerk'), '/account');
});

test("Clerk's absolute redirect_url is reduced to its path", () => {
  assert.equal(safeNext('https://shop.example/account/orders', 'https://shop.example'), '/account/orders');
  assert.equal(safeNext('https://evil.example/account', 'https://shop.example'), '/account');
});

test('loginHref encodes the return path', () => {
  assert.equal(loginHref('/checkout'), '/login?next=%2Fcheckout');
});
