// Screenshot Who We Are at a width and print the script ink box relative to the photo.
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
const widths = process.argv.slice(2).map(Number);
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
for (const w of widths.length ? widths : [1440, 393]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: 'header{visibility:hidden!important}' });
  const sec = page.locator('section[aria-labelledby="who-we-are-title"]');
  await sec.scrollIntoViewIfNeeded(); await page.waitForTimeout(400);
  const file = `.shots/who-ink-${w}.png`;
  // Clip a little past the section so any overhanging script is captured too.
  const bb = await sec.boundingBox();
  await page.screenshot({ path: file, fullPage: true, clip: { x: 0, y: bb.y + (await page.evaluate(() => scrollY)), width: w, height: bb.height + 300 } });
  const r = await page.evaluate(() => {
    const s = document.querySelector('section[aria-labelledby="who-we-are-title"]').getBoundingClientRect();
    const p = document.querySelector('section[aria-labelledby="who-we-are-title"] img').parentElement.getBoundingClientRect();
    return [p.left - s.left, p.top - s.top, p.width, p.height].map(Math.round).join(',');
  });
  process.stdout.write(w + ' ' + execFileSync('node', ['scripts/script-ink.mjs', file, r]));
  await page.close();
}
await browser.close();
