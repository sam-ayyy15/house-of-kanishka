// Screenshot one page of the running site at the two reference widths, lightly (waits for
// load, not for the network to go quiet). Cookie banner is dismissed and the home intro skipped.
// Usage: node scripts/shot-light.mjs <path> [baseUrl] [name] [scrollToSelector]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const [path = '/', base = 'http://localhost:3100', nameArg, selector] = process.argv.slice(2);
const OUT = '.shots';
mkdirSync(OUT, { recursive: true });
const name = nameArg ?? (path === '/' ? 'home' : path.replace(/\W+/g, '-').replace(/^-|-$/g, ''));

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
for (const [w, h] of [[1440, 900], [393, 852]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('hok-consent-v1', JSON.stringify({ analytics: false, marketing: false, at: Date.now() }));
      sessionStorage.setItem('hok-intro-seen', '1');
    } catch {}
  });
  const page = await ctx.newPage();
  await page.goto(base + path, { waitUntil: 'load', timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  if (selector) await page.locator(selector).first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `${OUT}/${name}-${w}.png` });
  await ctx.close();
}
await browser.close();
console.log('saved', name);
