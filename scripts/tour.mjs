// Full-page screenshots of every route at 1440 and 390, with a seeded bag and wishlist.
// Reports horizontal overflow and console errors. Usage: node scripts/tour.mjs [route ...]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const ROUTES = process.argv.slice(2).length ? process.argv.slice(2) : [
  '/', '/dresses', '/accessories', '/new-arrivals', '/products/carnivorous-rose-blazer', '/products/wool-beret',
  '/products/floral-satin-midi-dress', '/bag', '/checkout', '/wishlist', '/login', '/search', '/the-brand',
  '/collections/ash-x-cos-2025', '/collections/golden-hour-paris', '/collections/midnight-rose',
  '/shipping-returns', '/size-guide', '/contact', '/nope',
];
const SEED = JSON.stringify({
  bag: [{ slug: 'carnivorous-rose-blazer', size: 'S/36', qty: 1 }, { slug: 'wool-beret', size: 'One size', qty: 2 }],
  wishlist: ['flowing-halter-dress', 'pyramid-leather-tote', 'ball-earrings'],
});
mkdirSync('.shots/tour', { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript((seed) => localStorage.setItem('hok-store-v1', seed), SEED);
  for (const route of ROUTES) {
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errors.push(m.text().slice(0, 160)); });
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));
    await page.goto('http://localhost:3000' + route, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); } scrollTo(0, 0); });
    await page.waitForTimeout(1100);
    const name = (route === '/' ? 'home' : route.slice(1).replace(/\W+/g, '-')) + '-' + w;
    await page.screenshot({ path: `.shots/tour/${name}.png`, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (overflow || errors.length) console.log(w, route, overflow ? 'OVERFLOW' : '', errors.join(' | '));
    await page.close();
  }
  await ctx.close();
}
await browser.close();
console.log('tour done');
