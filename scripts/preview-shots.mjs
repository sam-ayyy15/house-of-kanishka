// Clean screenshots of the new pages into preview-screenshots/ (cookie banner dismissed).
import { chromium } from 'playwright-core';
const OUT = 'preview-screenshots';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const sizes = { desktop: [1440, 900], phone: [393, 852] };

async function open(size, path, { intro = false, dismiss = true } = {}) {
  const [w, h] = sizes[size];
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: size === 'phone' ? 2 : 1 });
  const page = await ctx.newPage();
  if (!intro) await page.addInitScript(() => sessionStorage.setItem('hok-intro', '1'));
  await page.goto('http://localhost:3000' + path, { waitUntil: 'commit', timeout: 180000 });
  if (dismiss) {
    const btn = page.getByRole('button', { name: /essential only/i });
    await btn.waitFor({ timeout: 20000 }).catch(() => {});
    await btn.click({ timeout: 3000 }).catch(() => {});
  }
  return { ctx, page };
}
const shot = (page, name) => page.screenshot({ path: `${OUT}/${name}.png` });

for (const size of ['desktop', 'phone']) {
  // 404
  let { ctx, page } = await open(size, '/nope');
  await page.waitForSelector('canvas', { timeout: 60000 });
  await page.waitForTimeout(3500);
  await shot(page, `1-404-satin-${size}`);
  await ctx.close();

  // Error page: flower, then scattered
  ({ ctx, page } = await open(size, '/zz-error-test'));
  await page.waitForSelector('canvas', { timeout: 60000 });
  await page.waitForTimeout(450);
  await shot(page, `2-error-flower-${size}`);
  await page.waitForTimeout(4500);
  await shot(page, `3-error-petals-${size}`);
  await ctx.close();

  // Skeletons
  for (const [k, label] of [['', 'listing'], ['p', 'product']]) {
    ({ ctx, page } = await open(size, '/zz-skel?k=' + k));
    await page.waitForTimeout(500);
    await shot(page, `4-skeleton-${label}-${size}`);
    await ctx.close();
  }

  // Offline page
  ({ ctx, page } = await open(size, '/offline.html', { dismiss: false }));
  await page.waitForTimeout(2200);
  await shot(page, `5-offline-${size}`);
  await ctx.close();

  // Opening title: drawing, name, just before the lift
  ({ ctx, page } = await open(size, '/', { intro: true, dismiss: false }));
  const t0 = Date.now();
  for (const [t, label] of [[700, 'a-drawing'], [1500, 'b-name'], [2050, 'c-hold']]) {
    await page.waitForTimeout(Math.max(0, t - (Date.now() - t0)));
    await shot(page, `6-intro-${label}-${size}`);
  }
  await ctx.close();
}
await browser.close();
console.log('done');
