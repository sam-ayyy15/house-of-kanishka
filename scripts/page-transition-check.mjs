// Clicks through pages and records whether a view transition ran, plus mid-transition frames.
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
for (const reducedMotion of ['no-preference', 'reduce']) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 140)));
  await p.addInitScript(() => {
    window.__vt = [];
    const orig = document.startViewTransition?.bind(document);
    if (orig) document.startViewTransition = (arg) => {
      const t = orig(arg);
      const rec = { start: performance.now() };
      window.__vt.push(rec);
      t.finished.then(() => (rec.end = performance.now()));
      return t;
    };
  });
  await p.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  for (const [label, href] of [['New Arrivals', '/new-arrivals'], ['logo', '/']]) {
    const link = label === 'logo' ? p.locator('header a[href="/"]').first() : p.locator(`header a[href="${href}"]`).first();
    await link.click();
    if (reducedMotion === 'no-preference') {
      await p.waitForTimeout(250);
      await p.screenshot({ path: `.shots/vt-${href === '/' ? 'home' : 'new-arrivals'}-mid.png` });
    }
    await p.waitForURL('**' + href);
    await p.waitForTimeout(900);
  }
  const vt = await p.evaluate(() => window.__vt.map((r) => Math.round((r.end ?? NaN) - r.start)));
  const headerName = await p.$eval('header', (h) => getComputedStyle(h).viewTransitionName);
  console.log(reducedMotion, '| transitions run:', vt.length, '| durations ms:', vt.join(', '), '| header name:', headerName, '| errors:', errors.length ? errors : 'none');
  await ctx.close();
}
await b.close();
