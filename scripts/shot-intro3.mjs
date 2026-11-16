// Frames of the opening title measured from the moment it starts playing (data-intro=go).
import { chromium } from 'playwright-core';
const [,, w = '1440', h = '900', tag = 'd', times = '600,1400,2200,2750'] = process.argv;
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: +w, height: +h } });
const page = await ctx.newPage();
const logs = [];
page.on('console', (m) => ['error', 'warning'].includes(m.type()) && !/Clerk|Clock/.test(m.text()) && logs.push(m.text().slice(0, 300)));
page.on('pageerror', (e) => logs.push('pageerror ' + e.message.slice(0, 300)));
await page.goto('http://localhost:3000/', { waitUntil: 'commit', timeout: 180000 });
await page.waitForFunction(() => document.documentElement.getAttribute('data-intro') === 'go', null, { timeout: 30000 });
const t0 = Date.now();
for (const t of times.split(',').map(Number)) {
  await page.waitForTimeout(Math.max(0, t - (Date.now() - t0)));
  await page.screenshot({ path: `.shots/i3-${tag}-${t}.png` });
}
console.log('canvas:', await page.evaluate(() => !!document.querySelector('.intro canvas')), logs.join(' | ') || 'no issues');
await browser.close();
