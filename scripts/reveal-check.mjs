// Scrolls each route top to bottom (motion on) and verifies every reveal finishes:
// nothing left "pending", no revealed element invisible, no curtain still covering,
// no word or letter still masked, no console errors.
// Usage: node scripts/reveal-check.mjs [route,route...] [width]
import { chromium } from 'playwright-core';
const routes = (process.argv[2] || '/').split(',');
const width = Number(process.argv[3] || 1440);
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
let bad = 0;
for (const r of routes) {
  const p = await b.newPage({ viewport: { width, height: width > 500 ? 900 : 852 } });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message.slice(0, 140)));
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 140)));
  await p.goto('http://localhost:3000' + r, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(600);
  const pending0 = await p.evaluate(() => document.querySelectorAll('[data-reveal-state="pending"]').length);
  await p.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += 240) { scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 140)); }
  });
  await p.waitForTimeout(6500);
  const res = await p.evaluate(() => {
    const vis = (e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
    const out = { pending: 0, invisible: [], curtains: 0, words: 0, letters: 0, total: document.querySelectorAll('[data-reveal]').length };
    for (const el of document.querySelectorAll('[data-reveal]')) {
      if (!vis(el)) continue;
      if (el.dataset.revealState === 'pending') out.pending++;
      if (Number(getComputedStyle(el).opacity) < 0.99) out.invisible.push(el.dataset.reveal + ':' + (el.className || el.tagName).toString().slice(0, 40));
      if (el.dataset.reveal === 'curtain') { const t = getComputedStyle(el, '::after').transform; if (t && t !== 'none' && !/matrix\(1, 0, 0, 0,/.test(t)) out.curtains++; }
    }
    for (const w of document.querySelectorAll('.rw > span')) { if (!vis(w)) continue; const t = getComputedStyle(w).transform; if (t !== 'none' && t !== 'matrix(1, 0, 0, 1, 0, 0)') out.words++; }
    for (const l of document.querySelectorAll('.hw')) { if (!vis(l)) continue; const m = getComputedStyle(l).maskPosition; if (m && !/^0(%|px) /.test(m) && getComputedStyle(l).maskImage !== 'none') out.letters++; }
    return out;
  });
  const ok = !res.pending && !res.invisible.length && !res.curtains && !res.words && !res.letters && !errors.length;
  if (!ok) bad++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${r.padEnd(40)} reveals ${res.total} (pending at load ${pending0}) | stuck: pending ${res.pending}, invisible ${res.invisible.length}, curtains ${res.curtains}, words ${res.words}, letters ${res.letters} | errors ${errors.length}`);
  if (!ok) console.log('     ', JSON.stringify(res.invisible).slice(0, 300), errors.slice(0, 3));
  await p.close();
}
await b.close();
process.exit(bad ? 1 : 0);
