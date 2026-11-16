// Real-time frames of the loading screen. usage: node scripts/shot-load.mjs tag w h [nav]
import { chromium } from 'playwright-core';
const [,, tag = 'd', w = '1440', h = '900', mode = 'load'] = process.argv;
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await browser.newContext({ viewport: { width: +w, height: +h } });
const page = await ctx.newPage();
const errs = [];
page.on('console', (m) => m.type() === 'error' && !/Clerk/.test(m.text()) && errs.push(m.text().slice(0, 200)));
page.on('pageerror', (e) => errs.push('pageerror ' + e.message.slice(0, 200)));
if (mode === 'nav') {
  await page.goto('http://localhost:3000/dresses', { waitUntil: 'load', timeout: 120000 });
  console.log('on /dresses, intro attr:', await page.evaluate(() => document.documentElement.getAttribute('data-intro')));
  await page.waitForTimeout(800);
  const link = page.locator('header a[href="/"]').first();
  await link.click();
} else {
  await page.goto('http://localhost:3000/', { waitUntil: 'commit', timeout: 120000 });
}
await page.waitForFunction(() => document.documentElement.getAttribute('data-intro') === 'go', null, { polling: 8, timeout: 20000 });
const t0 = Date.now();
const marks = [200, 700, 1200, 1800, 2400, 3000, 3600];
for (const t of marks) {
  await page.waitForTimeout(Math.max(0, t - (Date.now() - t0)));
  await page.screenshot({ path: `.shots/ld-${tag}-${t}.png` });
}
await page.waitForFunction(() => document.documentElement.getAttribute('data-intro') === 'done', null, { polling: 8, timeout: 20000 });
const t1 = Date.now();
for (const t of [450, 900]) {
  await page.waitForTimeout(Math.max(0, t - (Date.now() - t1)));
  await page.screenshot({ path: `.shots/ld-${tag}-x${t}.png` });
}
await page.waitForFunction(() => !document.documentElement.getAttribute('data-intro'), null, { timeout: 20000 });
console.log('finished; errors:', errs.join(' | ') || 'none');
await browser.close();
