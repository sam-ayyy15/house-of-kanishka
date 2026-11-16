// Asks Chrome which intro animations it could NOT run on the compositor (off the main thread).
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
const mode = process.argv[2] || 'load';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await browser.startTracing(page, { categories: ['devtools.timeline', 'blink.animations', 'cc', 'benchmark', 'rail'], path: '/tmp/claude-1000/trace.json' });
await page.goto('http://localhost:3000/', { waitUntil: 'commit', timeout: 120000 });
await page.waitForTimeout(6500);
await browser.stopTracing();
const trace = JSON.parse((await import('node:fs')).readFileSync('/tmp/claude-1000/trace.json', 'utf8'));
const events = trace.traceEvents ?? trace;
const seen = new Map();
for (const e of events) {
  if (e.name !== 'Animation') continue;
  const d = e.args?.data;
  if (!d) continue;
  const key = d.id ?? e.id;
  const row = seen.get(key) ?? {};
  Object.assign(row, { state: d.state ?? row.state, failed: d.compositeFailed ?? row.failed, unsupported: d.unsupportedProperties ?? row.unsupported, name: d.displayName ?? d.nodeName ?? row.name });
  seen.set(key, row);
}
const rows = [...seen.values()];
const bad = rows.filter((r) => r.failed || (r.unsupported && r.unsupported.length));
console.log('animations seen:', rows.length, '| not fully compositor-driven:', bad.length);
const summary = {};
for (const r of bad) { const k = (r.name || '?') + ' :: ' + JSON.stringify(r.unsupported || r.failed); summary[k] = (summary[k] || 0) + 1; }
console.log(JSON.stringify(summary, null, 1).slice(0, 1800));
await browser.close();
