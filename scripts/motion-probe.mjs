// Generic probe: open a route, optionally scroll, report computed values and errors.
// Usage: node scripts/motion-probe.mjs <route> <json: [{sel, props:[...]}]> [scrollY...]
import { chromium } from 'playwright-core';
const [,, route, specJson, ...ys] = process.argv;
const spec = JSON.parse(specJson);
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
p.on('pageerror', (e) => errors.push(e.message.slice(0, 140)));
p.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 140)));
await p.goto('http://localhost:3000' + route, { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(2500);
for (const y of ys.length ? ys.map(Number) : [0]) {
  await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), y);
  await p.waitForTimeout(350);
  const out = await p.evaluate((spec) => spec.map(({ sel, props }) => {
    const el = document.querySelector(sel);
    if (!el) return sel + ': MISSING';
    const cs = getComputedStyle(el);
    return sel + ' → ' + props.map((k) => `${k}=${cs.getPropertyValue(k)}`).join('; ');
  }), spec);
  console.log(`scrollY=${y}\n  ` + out.join('\n  '));
}
console.log('errors:', errors.length ? errors : 'none');
await b.close();
