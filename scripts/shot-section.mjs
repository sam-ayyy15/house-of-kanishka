// Screenshot one element at 1440 and 393 wide.
// Usage: node scripts/shot-section.mjs <path> <css selector> <name>
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const [,, path, selector, name] = process.argv;
mkdirSync('.shots', { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
for (const [w, h] of [[1440, 900], [393, 852]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto('http://localhost:3000' + path, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const el = page.locator(selector).first();
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  // Hide the fixed header so it doesn't cover the section being captured.
  await page.addStyleTag({ content: 'header{visibility:hidden!important}' });
  await el.screenshot({ path: `.shots/${name}-${w}.png` });
  await page.close();
}
await browser.close();
