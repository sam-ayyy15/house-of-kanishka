// Full-page screenshots of a route at 1440 and 393.
import { chromium } from 'playwright-core';
const [,, path, name] = process.argv;
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
for (const [w, h] of [[1440, 900], [393, 852]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto('http://localhost:3000' + path, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  // Scroll through so lazy images load, then back to the top.
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 60)); } scrollTo({ top: 0, behavior: 'instant' }); });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `.shots/${name}-${w}.png` });
  await page.screenshot({ path: `.shots/${name}-${w}-full.png`, fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  console.log(w, 'horizontal overflow:', overflow);
  await page.close();
}
await browser.close();
