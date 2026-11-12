// Captures the Who We Are first-view sequence and compares its end state with the static
// (reduced-motion) render.
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const SEL = 'section[aria-labelledby="who-we-are-title"]';
async function open(reducedMotion) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion });
  const p = await ctx.newPage();
  await p.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.addStyleTag({ content: 'header{visibility:hidden!important}' });
  return { ctx, p };
}
const { p } = await open('no-preference');
console.log('state before scroll:', await p.$eval(`${SEL} [data-reveal="cinema"]`, (e) => e.dataset.revealState));
await p.locator(SEL).scrollIntoViewIfNeeded();
const t0 = Date.now();
for (const t of [300, 1300, 2600, 3000, 3800, 4600, 5600]) {
  await p.waitForTimeout(Math.max(0, t - (Date.now() - t0)));
  const photo = await p.$eval(`${SEL} img`, (img) => getComputedStyle(img.parentElement).transform);
  await p.locator(SEL).screenshot({ path: `.shots/who-seq-${t}.png` });
  console.log(`t=${t}ms photo transform: ${photo}`);
}
const { p: still } = await open('reduce');
await still.locator(SEL).scrollIntoViewIfNeeded();
await still.waitForTimeout(500);
console.log('reduced-motion state:', await still.$eval(`${SEL} [data-reveal="cinema"]`, (e) => e.dataset.revealState ?? 'none'),
  '| photo transform:', await still.$eval(`${SEL} img`, (img) => getComputedStyle(img.parentElement).transform));
await still.locator(SEL).screenshot({ path: '.shots/who-seq-static.png' });
await b.close();
