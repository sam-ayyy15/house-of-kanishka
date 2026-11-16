// Frames of the error page's first seconds: usage node scripts/shot-early.mjs name ms,ms,ms [w] [h]
import { chromium } from 'playwright-core';
const [,, name, times = '500,900,1400,2200,3200', w = '1440', h = '900'] = process.argv;
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
await page.goto('http://localhost:3000/zz-error-test', { waitUntil: 'commit', timeout: 90000 });
await page.waitForSelector('canvas', { timeout: 60000 });
const t0 = Date.now();
for (const t of times.split(',').map(Number)) {
  await page.waitForTimeout(Math.max(0, t - (Date.now() - t0)));
  await page.screenshot({ path: `.shots/${name}-${t}.png`, clip: { x: 0, y: 60, width: +w, height: Math.min(+h, 640) - 60 } });
}
await browser.close();
