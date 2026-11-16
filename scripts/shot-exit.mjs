// Real-time frames of the exit (no seeking), starting when data-intro becomes "done".
import { chromium } from 'playwright-core';
const [,, w = '1440', h = '900', tag = 'd', step = '150', count = '9'] = process.argv;
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await browser.newContext({ viewport: { width: +w, height: +h } });
const page = await ctx.newPage();
await page.goto('http://localhost:3000/', { waitUntil: 'commit', timeout: 180000 });
await page.waitForFunction(() => document.documentElement.getAttribute('data-intro') === 'done', null, { timeout: 30000, polling: 16 });
const t0 = Date.now();
for (let i = 0; i < +count; i++) {
  await page.screenshot({ path: `.shots/x-${tag}-${i}.png`, type: 'jpeg', quality: 70 });
  const wait = (i + 1) * +step - (Date.now() - t0);
  if (wait > 0) await page.waitForTimeout(wait);
}
await browser.close();
