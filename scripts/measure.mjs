// Print bounding boxes (as % of viewport width/hero height) for quick tuning.
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
for (const [w, h] of [[1440, 900], [393, 852]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const r = await page.evaluate((sels) => sels.map((s) => {
    const el = document.querySelector(s); if (!el) return [s, null];
    const b = el.getBoundingClientRect(); const H = document.getElementById('hero').offsetHeight;
    return [s, { x: +(b.left / innerWidth * 100).toFixed(1), x2: +(b.right / innerWidth * 100).toFixed(1), y: +(b.top / H * 100).toFixed(1), y2: +(b.bottom / H * 100).toFixed(1), px: [Math.round(b.width), Math.round(b.height)] }];
  }), process.argv.slice(2));
  console.log(w, JSON.stringify(r));
  await page.close();
}
await browser.close();
