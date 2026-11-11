// Screenshot the running dev server at the two reference widths (CLAUDE.md).
// Usage: node scripts/screenshot.mjs [path=/] [baseUrl=http://localhost:3000]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const path = process.argv[2] ?? '/';
const base = process.argv[3] ?? 'http://localhost:3000';
const OUT = '.shots';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const slug = path === '/' ? 'home' : path.replace(/\W+/g, '-').replace(/^-|-$/g, '');

for (const [name, width, height] of [['1440', 1440, 900], ['393', 393, 852]]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(base + path, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${OUT}/${slug}-${name}.png` });
  await page.screenshot({ path: `${OUT}/${slug}-${name}-full.png`, fullPage: true });
  await page.close();
}
await browser.close();
console.log('saved to', OUT);
