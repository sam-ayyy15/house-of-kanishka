// Captures the Accessories orbit at 8 angles (animation sped up for the test only) and
// reports whether any piece or label leaves the section or covers the centre text.
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
await page.addStyleTag({ content: 'header{visibility:hidden!important}' });
const sel = 'section[aria-labelledby="accessories-title"]';
await page.evaluate((s) => document.querySelector(s).scrollIntoView({ behavior: 'instant', block: 'center' }), sel);
await page.waitForTimeout(1200);
let worst = { out: 0, overlap: 0 };
for (let i = 0; i < 8; i++) {
  // Freeze the orbit at a fixed angle.
  await page.evaluate(([s, a]) => { const ul = document.querySelector(s + ' > ul'); ul.style.animation = 'none'; ul.style.setProperty('--acc-a', a + 'deg'); }, [sel, i * 45]);
  await page.waitForTimeout(150);
  const r = await page.evaluate((s) => {
    const sec = document.querySelector(s).getBoundingClientRect();
    const c = document.querySelector(s + ' > div').getBoundingClientRect();
    let out = 0, overlap = 0;
    for (const el of document.querySelectorAll(s + ' li[data-n] div div, ' + s + ' li[data-n] span')) {
      const b = el.getBoundingClientRect();
      out = Math.max(out, sec.left - b.left, b.right - sec.right, sec.top - b.top, b.bottom - sec.bottom);
      const ox = Math.min(b.right, c.right) - Math.max(b.left, c.left), oy = Math.min(b.bottom, c.bottom) - Math.max(b.top, c.top);
      if (ox > 0 && oy > 0) overlap = Math.max(overlap, Math.min(ox, oy));
    }
    return { out: Math.round(out), overlap: Math.round(overlap) };
  }, sel);
  worst = { out: Math.max(worst.out, r.out), overlap: Math.max(worst.overlap, r.overlap) };
  if (i % 2 === 0) await page.locator(sel).screenshot({ path: `.shots/orbit-${i * 45}.png` });
}
console.log('worst px outside section:', worst.out, '| worst px overlapping centre text box:', worst.overlap);
await browser.close();
