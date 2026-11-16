// Records the loading bar's right edge on every animation frame and reports any backward jumps.
// usage: node scripts/bar-trace.mjs [load|nav]
import { chromium } from 'playwright-core';
const mode = process.argv[2] || 'load';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));
if (mode === 'nav') {
  await page.goto('http://localhost:3000/the-brand', { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(800);
  // Start recording BEFORE the click: a page-level observer of attribute changes and bar position.
  await page.evaluate(() => {
    window.__log = [];
    window.__attr = [];
    new MutationObserver(() => window.__attr.push([Math.round(performance.now()), document.documentElement.getAttribute('data-intro'), document.documentElement.hasAttribute('data-intro-nav')])).observe(document.documentElement, { attributes: true, attributeFilter: ['data-intro', 'data-intro-nav'] });
    const t0 = performance.now();
    (function tick() {
      const el = document.querySelector('.intro-fill');
      const vis = getComputedStyle(document.querySelector('.intro')).display !== 'none';
      if (el && vis) window.__log.push([Math.round(performance.now()), Math.round(el.getBoundingClientRect().right)]);
      if (performance.now() - t0 < 9000) requestAnimationFrame(tick);
    })();
  });
  await page.locator('header a[href="/"]').first().click();
} else {
  await page.addInitScript(() => {
    window.__log = [];
    window.__attr = [];
    const t0 = performance.now();
    document.addEventListener('DOMContentLoaded', () => {
      new MutationObserver(() => window.__attr.push([Math.round(performance.now()), document.documentElement.getAttribute('data-intro'), document.documentElement.hasAttribute('data-intro-nav')])).observe(document.documentElement, { attributes: true, attributeFilter: ['data-intro', 'data-intro-nav'] });
    });
    (function tick() {
      const el = document.querySelector('.intro-fill');
      const root = document.documentElement;
      if (el && root.getAttribute('data-intro')) window.__log.push([Math.round(performance.now()), Math.round(el.getBoundingClientRect().right)]);
      if (performance.now() - t0 < 9000) requestAnimationFrame(tick);
    })();
  });
  await page.goto('http://localhost:3000/', { waitUntil: 'commit', timeout: 120000 });
}
await page.waitForTimeout(9500);
const { log, attr } = await page.evaluate(() => ({ log: window.__log, attr: window.__attr }));
let back = [];
for (let i = 1; i < log.length; i++) if (log[i][1] < log[i - 1][1] - 2) back.push({ at: log[i][0], from: log[i - 1][1], to: log[i][1] });
const first = log[0]?.[0], last = log.at(-1)?.[0];
console.log(mode, '| samples:', log.length, '| visible for ms:', last - first, '| backward jumps:', back.length, JSON.stringify(back.slice(0, 5)));
console.log('attribute changes:', JSON.stringify(attr));
console.log('max right edge reached:', Math.max(...log.map((l) => l[1])), '| page errors:', errs.join() || 'none');
await browser.close();
