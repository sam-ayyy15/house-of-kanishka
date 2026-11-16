// Screenshots a route at 1440 and 393 with software WebGL, and reports console errors.
// usage: node scripts/shot-3d.mjs /path name [waitMs]
import { chromium } from 'playwright-core';
const [,, path, name, wait = '2500'] = process.argv;
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'],
});
for (const [w, h] of [[1440, 900], [393, 852]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const logs = [];
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && logs.push(`${m.type()}: ${m.text().slice(0, 220)}`));
  page.on('pageerror', (e) => logs.push('pageerror: ' + e.message.slice(0, 220)));
  await page.goto('http://localhost:3000' + path, { waitUntil: 'load', timeout: 90000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(Number(wait));
  if (process.env.EARLY) { await page.screenshot({ path: `.shots/${name}-early-${w}.png` }); await page.waitForTimeout(4500); }
  await page.screenshot({ path: `.shots/${name}-${w}.png` });
  const info = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, canvas: !!document.querySelector('canvas') }));
  console.log(w, JSON.stringify(info), logs.filter((l) => !/Clock/.test(l)).join(' | ') || 'no console issues');
  await page.close();
}
await browser.close();
