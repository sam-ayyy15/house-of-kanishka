// Full-page screenshots of every route with reduced motion (the static end state).
// Usage: node scripts/static-snapshots.mjs <outDir>
// Run before and after motion work, then compare with scripts/snapshot-diff.mjs.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const out = process.argv[2];
mkdirSync(out, { recursive: true });
const routes = (process.argv[3] ? process.argv[3].split(',') : ['/', '/dresses', '/new-arrivals', '/accessories', '/products/carnivorous-rose-blazer',
  '/products/flowing-halter-dress', '/the-brand', '/collections/golden-hour-paris', '/collections/midnight-rose',
  '/login', '/help', '/bag', '/search', '/wishlist', '/checkout']);
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
for (const [w, h] of [[1440, 900], [393, 852]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
  for (const r of routes) {
    const p = await ctx.newPage();
    const errors = [];
    p.on('pageerror', (e) => errors.push(e.message.slice(0, 120)));
    await p.goto('http://localhost:3000' + r, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    // Scroll through so lazy images load; pause videos so frames are comparable.
    await p.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); }
      scrollTo(0, 0);
      document.querySelectorAll('video').forEach((v) => { v.pause(); v.removeAttribute('src'); v.load(); });
    });
    await p.waitForTimeout(700);
    const name = (r === '/' ? 'home' : r.slice(1).replace(/\W+/g, '-')) + '-' + w;
    await p.screenshot({ path: `${out}/${name}.png`, fullPage: true });
    if (errors.length) console.log(name, 'errors:', errors);
    await p.close();
  }
  await ctx.close();
}
await b.close();
console.log('done', out);
