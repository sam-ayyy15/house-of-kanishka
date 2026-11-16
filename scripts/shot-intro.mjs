// Frames of the opening title, then a reload in the same session (must not replay).
import { chromium } from 'playwright-core';
const [,, w = '1440', h = '900', tag = 'd'] = process.argv;
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await browser.newContext({ viewport: { width: +w, height: +h } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto('http://localhost:3000/', { waitUntil: 'commit', timeout: 120000 });
const t0 = Date.now();
for (const t of [200, 800, 1400, 2000, 2700, 3400, 4300]) {
  await page.waitForTimeout(Math.max(0, t - (Date.now() - t0)));
  await page.screenshot({ path: `.shots/intro-${tag}-${t}.png` });
  console.log(t, await page.evaluate(() => document.documentElement.getAttribute('data-intro')));
}
await page.reload({ waitUntil: 'commit' });
await page.waitForTimeout(400);
console.log('after reload:', await page.evaluate(() => document.documentElement.getAttribute('data-intro')), errs.join('|') || 'no page errors');
await browser.close();
