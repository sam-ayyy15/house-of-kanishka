// Real-time preview frames of the opening title into preview-screenshots/.
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
for (const [tag, w, h] of [['desktop', 1440, 900], ['phone', 393, 852]]) {
  const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
  await page.goto('http://localhost:3000/', { waitUntil: 'commit', timeout: 180000 });
  await page.waitForFunction(() => document.documentElement.getAttribute('data-intro') === 'go', null, { polling: 8 });
  const t0 = Date.now();
  for (const [t, name] of [[1600, 'a-drawing'], [3300, 'b-name'], [4500, 'c-hold']]) {
    await page.waitForTimeout(Math.max(0, t - (Date.now() - t0)));
    await page.screenshot({ path: `preview-screenshots/6-intro-${name}-${tag}.png` });
  }
  await page.waitForFunction(() => document.documentElement.getAttribute('data-intro') === 'done', null, { polling: 8 });
  const t1 = Date.now();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `preview-screenshots/6-intro-d-lift-${tag}.png` });
}
await browser.close();
