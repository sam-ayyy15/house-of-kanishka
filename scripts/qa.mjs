// Motion + behaviour QA against a running build. Usage: node scripts/qa.mjs [baseUrl]
import { chromium } from 'playwright-core';
const BASE = process.argv[2] ?? 'http://localhost:3100';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const log = (k, v) => console.log(k.padEnd(34), typeof v === 'string' ? v : JSON.stringify(v));

// 1. Load metrics on the homepage, phone size with CPU throttled 4x.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.addInitScript(() => {
    window.__m = { lcp: 0, cls: 0, long: [] };
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.long.push(Math.round(e.duration)); }).observe({ type: 'longtask', buffered: true });
  });
  const requests = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const videoBeforeScroll = requests.some((u) => u.includes('.webm'));
  const before = await page.evaluate(() => ({ ...window.__m, long: [...window.__m.long] }));
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 300) { scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 120)); } });
  await page.waitForTimeout(800);
  const after = await page.evaluate(() => window.__m);
  log('LCP (phone, 4x CPU)', Math.round(before.lcp) + ' ms');
  log('CLS on load', before.cls.toFixed(4));
  log('CLS after full scroll', after.cls.toFixed(4));
  log('long tasks on load (ms)', before.long);
  log('long tasks while scrolling (ms)', after.long.slice(before.long.length));
  log('video requested before scroll', String(videoBeforeScroll));
  log('video requested after scroll', String(requests.some((u) => u.includes('.webm'))));
  const js = await page.evaluate(() => performance.getEntriesByType('resource').filter((r) => r.name.endsWith('.js')).reduce((n, r) => n + r.transferSize, 0));
  log('total JS transferred', Math.round(js / 1024) + ' KB');
  await ctx.close();
}

// 2. Reduced motion: nothing hidden, nothing animating, video paused.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 60)); } });
  const r = await page.evaluate(() => ({
    pending: document.querySelectorAll('[data-reveal-state="pending"]').length,
    hidden: [...document.querySelectorAll('[data-reveal], h1 span')].filter((e) => getComputedStyle(e).opacity !== '1').length,
    running: document.getAnimations().filter((a) => a.playState === 'running' && (a.effect?.getComputedTiming().duration ?? 0) > 1).length,
    videoPaused: document.querySelector('video')?.paused,
    videoHasSource: !!document.querySelector('video source'),
  }));
  log('reduced motion', r);
  await ctx.close();
}

// 3. Normal motion: reveals complete and end at rest; behaviour checks.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  const initiallyPending = await page.evaluate(() => document.querySelectorAll('[data-reveal-state="pending"]').length);
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 100)); } });
  await page.waitForTimeout(1400);
  const rest = await page.evaluate(() => ({
    stillPending: document.querySelectorAll('[data-reveal-state="pending"]').length,
    notAtRest: [...document.querySelectorAll('[data-reveal]')].filter((e) => { const s = getComputedStyle(e); return s.opacity !== '1' || (s.transform !== 'none' && s.transform !== 'matrix(1, 0, 0, 1, 0, 0)'); }).length,
  }));
  log('reveals pending on load', String(initiallyPending));
  log('reveals after scroll', rest);

  // Keyboard: first Tab stops show a visible focus ring.
  await page.goto(BASE + '/dresses', { waitUntil: 'networkidle' });
  const rings = [];
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    rings.push(await page.evaluate(() => { const e = document.activeElement; const s = getComputedStyle(e); return `${e.textContent.trim().slice(0, 14)}:${s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 ? 'ring' : 'NO RING'}`; }));
  }
  log('focus rings', rings.join(' | '));

  // Menu drawer: opens, focus moves inside, Escape closes and returns focus.
  await page.click('header button:has-text("Shop")');
  await page.waitForTimeout(600);
  const menu = await page.evaluate(() => { const d = document.querySelector('dialog[open]'); const p = d?.firstElementChild.getBoundingClientRect(); return { open: !!d, panelLeft: p && Math.round(p.left), focusInside: !!d?.contains(document.activeElement) }; });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  const afterEsc = await page.evaluate(() => ({ open: !!document.querySelector('dialog[open]'), focusBack: document.activeElement?.textContent.trim() }));
  log('menu drawer', { ...menu, afterEsc });

  // Listing: tab filter, sort, filter panel.
  const count = () => page.locator('main ul[data-captions] > li').count();
  const all = await count();
  await page.click('main button:has-text("Satin")');
  const satin = await count();
  await page.click('main button:has-text("View all")');
  await page.selectOption('main select', 'desc');
  const firstDesc = await page.locator('main ul[data-captions] > li a').first().getAttribute('href');
  await page.click('main button:has-text("Filter")');
  await page.waitForTimeout(500);
  await page.click('dialog[open] label:has-text("Pink")');
  const pink = await page.locator('dialog[open] .btn').textContent();
  await page.keyboard.press('Escape');
  log('listing', { all, satin, firstWhenSortedDesc: firstDesc, filterPanelButton: pink.trim() });

  // Product: add to bag updates the header count and confirms in place; wishlist toggles.
  await page.goto(BASE + '/products/flowing-halter-dress', { waitUntil: 'networkidle' });
  await page.selectOption('main label:has-text("Size") select', 'M/38');
  await page.click('main button:has-text("Add to cart")');
  const confirm = await page.locator('main .btn-red span').first().textContent();
  const headerCount = await page.locator('header a[href="/bag"]').first().textContent();
  await page.click('main button[aria-label="Add to wishlist"]');
  const pressed = await page.locator('main button[aria-pressed]').getAttribute('aria-pressed');
  await page.click('main button[role="tab"]:has-text("Size Guide")');
  const sizeRows = await page.locator('main [role="tabpanel"]:not([hidden]) tbody tr').count();
  log('product', { confirm, headerCount: headerCount.trim(), wishlistPressed: pressed, sizeGuideRows: sizeRows });

  // Bag → quantity → checkout.
  await page.goto(BASE + '/bag', { waitUntil: 'networkidle' });
  const line = await page.locator('main li').first().innerText();
  await page.click('main button[aria-label^="Increase"]');
  const total = await page.locator('main .btn-red span').last().textContent();
  await page.click('main a:has-text("Checkout")');
  await page.waitForURL('**/checkout');
  await page.click('main button:has-text("Place order")');
  const invalid = await page.evaluate(() => document.querySelector('main form :invalid')?.getAttribute('name'));
  const status = await page.locator("main form [role=status]").textContent();
  log("checkout status after empty submit", JSON.stringify(status));
  log("bag", { line: line.replace(/\s+/g, ' ').slice(0, 60), totalAfterPlus: total, checkoutBlocksEmptyForm: invalid });
  await page.goto(BASE + '/wishlist', { waitUntil: 'networkidle' });
  log('wishlist items', String(await page.locator('main ul > li').count()));
  await page.goto(BASE + '/search', { waitUntil: 'networkidle' });
  await page.fill('input[type=search]', 'satin');
  log('search "satin"', await page.locator('main [role=status]').textContent());
  log('page errors', errors.length ? errors : 'none');
  await ctx.close();
}
await browser.close();
