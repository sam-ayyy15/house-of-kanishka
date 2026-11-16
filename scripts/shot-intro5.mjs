// Opening title at exact points of its timeline (pauses CSS animations and seeks them).
// usage: node scripts/shot-intro5.mjs w h tag go:1000,go:2000,done:300 ...
import { chromium } from 'playwright-core';
const [,, w = '1440', h = '900', tag = 'd', ...marks] = process.argv;
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const page = await (await browser.newContext({ viewport: { width: +w, height: +h } })).newPage();
page.on('console', (m) => m.type() === 'error' && console.log('CONSOLE', m.text().slice(0, 300)));
page.on('pageerror', (e) => console.log('PAGEERROR', e.message.slice(0, 300)));
await page.addInitScript(() => { const st = window.setTimeout; window.setTimeout = (f, d, ...a) => (d === 3300 || d === 5000 ? 0 : st(f, d, ...a)); });
await page.goto('http://localhost:3000/', { waitUntil: 'commit', timeout: 180000 });
await page.waitForFunction(() => document.documentElement.getAttribute('data-intro') === 'go', null, { timeout: 30000 });
await page.waitForTimeout(500);
for (const mark of marks) {
  const [state, t] = mark.split(':');
  await page.evaluate(([state, t]) => {
    document.documentElement.setAttribute('data-intro', state);
    document.getAnimations().filter((a) => a.effect?.target?.closest?.('.intro') || a.effect?.target?.classList?.contains('intro')).forEach((a) => { a.pause(); a.currentTime = +t; });
  }, [state, t]);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `.shots/i6-${tag}-${state}-${t}.png` });
}
await browser.close();
