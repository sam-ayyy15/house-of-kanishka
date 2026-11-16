// Watches every CSS animation inside the loading screen: flags any whose clock goes backwards or that is
// re-created (a restart), and reports long frames. usage: node scripts/anim-trace.mjs [load|nav]
import { chromium } from 'playwright-core';
const mode = process.argv[2] || 'load';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const probe = () => {
  window.__t = { frames: [], resets: [], created: new Set(), last: new Map() };
  const t0 = performance.now();
  let prevFrame = performance.now();
  window.__t.stamps = [];
  requestAnimationFrame(function tick() {
    const now = performance.now();
    if (now - prevFrame > 50) window.__t.stamps.push([Math.round(now - t0), Math.round(now - prevFrame), document.documentElement?.getAttribute('data-intro')]);
    window.__t.frames.push(now - prevFrame);
    prevFrame = now;
    const on = document.documentElement?.getAttribute('data-intro');
    if (on) {
      for (const a of document.getAnimations()) {
        const el = a.effect?.target;
        if (!el || !(el.closest?.('.intro'))) continue;
        const key = (a.animationName || a.transitionProperty || '?') + '@' + (el.className?.baseVal ?? el.className) + '#' + [...(el.parentNode?.children ?? [])].indexOf(el);
        const t = a.currentTime ?? 0;
        const prev = window.__t.last.get(key);
        if (prev !== undefined && t < prev - 20) window.__t.resets.push([Math.round(now - t0), key, Math.round(prev), Math.round(t)]);
        window.__t.last.set(key, t);
      }
    }
    if (now - t0 < 9500) requestAnimationFrame(tick);
  });
};
const probeLater = () => { window.__probe = true; };
if (mode === 'nav') {
  await page.goto('http://localhost:3000/the-brand', { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(800);
  await page.evaluate(probe);
  await page.locator('header a[href="/"]').first().click();
} else {
  await page.addInitScript(`(${probe.toString()})()`);
  await page.goto('http://localhost:3000/', { waitUntil: 'commit', timeout: 120000 });
}
await page.waitForTimeout(10000);
const r = await page.evaluate(() => ({ frames: window.__t.frames, resets: window.__t.resets, stamps: window.__t.stamps }));
const long = r.frames.filter((f) => f > 50).map((f) => Math.round(f));
console.log('long frames [at ms, length ms, state]:', JSON.stringify(r.stamps.slice(0, 14)));
console.log(mode, '| frames:', r.frames.length, '| long frames (>50ms):', long.length, JSON.stringify(long.slice(0, 8)), '| animation restarts/resets:', r.resets.length, JSON.stringify(r.resets.slice(0, 6)));
await browser.close();
