// Scrolls a section into view and captures frames shortly after, to see reveals mid-flight.
// Usage: node scripts/mid-frames.mjs <route> <selector> <name> [ms,ms,...] [width]
import { chromium } from 'playwright-core';
const [,, route, sel, name, times = '250,700,1400', width = '1440'] = process.argv;
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const p = await b.newPage({ viewport: { width: Number(width), height: Number(width) > 500 ? 900 : 852 } });
await p.goto('http://localhost:3000' + route, { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(500);
await p.evaluate((sel) => { const el = document.querySelector(sel); scrollTo({ top: el.getBoundingClientRect().top + scrollY - 90, behavior: 'instant' }); }, sel);
const t0 = Date.now();
for (const t of times.split(',').map(Number)) {
  await p.waitForTimeout(Math.max(0, t - (Date.now() - t0)));
  await p.screenshot({ path: `.shots/mid-${name}-${t}.png` });
}
await b.close();
