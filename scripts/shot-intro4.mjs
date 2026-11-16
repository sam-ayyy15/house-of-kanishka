// Opening title at exact points of its timeline: pauses the CSS animations and seeks them.
import { chromium } from 'playwright-core';
const [,, w = '1440', h = '900', tag = 'd', times = '1700,2600'] = process.argv;
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: +w, height: +h } })).newPage();
page.on('console', (m) => ['error'].includes(m.type()) && console.log('CONSOLE', m.text().slice(0, 400)));
page.on('pageerror', (e) => console.log('PAGEERROR', e.message.slice(0, 400)));
await page.addInitScript(() => { const st = window.setTimeout; window.setTimeout = (f, d, ...a) => (d === 4450 || d === 5700 ? 0 : st(f, d, ...a)); });
await page.goto('http://localhost:3000/', { waitUntil: 'commit', timeout: 180000 });
await page.waitForFunction(() => document.documentElement.getAttribute('data-intro') === "go", null, { timeout: 30000 });
await page.waitForSelector('.intro-cloth[data-ready]', { timeout: 60000 });
await page.waitForTimeout(1200);
await page.evaluate(() => document.querySelector('.intro').style.pointerEvents = 'none');
for (const t of times.split(',').map(Number)) {
  await page.evaluate((t) => document.getAnimations().filter((a) => a.effect?.target?.closest?.('.intro') || a.effect?.target?.classList?.contains('intro')).forEach((a) => { a.pause(); a.currentTime = t; }), t);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `.shots/i4-${tag}-${t}.png` });
}
await browser.close();
