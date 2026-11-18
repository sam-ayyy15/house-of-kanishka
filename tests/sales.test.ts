import assert from 'node:assert/strict';
import { test } from 'node:test';
import { csvCell, toCsv } from '../lib/csv.ts';
import { istDay, niceMax, parseRange, rangeStart, summarise, type SaleOrder } from '../lib/sales.ts';

const now = new Date('2026-11-18T06:30:00Z'); // 12:00 noon in India
const order = (o: Partial<SaleOrder>): SaleOrder => ({
  number: 'HOK-1',
  status: 'confirmed',
  payment_method: 'online',
  total_inr: 8100,
  placed_at: '2026-11-18T05:00:00Z',
  items: [{ product_slug: 'halter', name: 'Halter Long Dress', qty: 1, unit_price_inr: 8100 }],
  ...o,
});

test('India days: 23:30 India time still counts as that day', () => {
  assert.equal(istDay('2026-11-17T18:00:00Z'), '2026-11-17'); // 23:30 IST
  assert.equal(istDay('2026-11-17T18:31:00Z'), '2026-11-18'); // 00:01 IST next day
});

test('a 7-day range starts at India midnight six days ago', () => {
  assert.equal(rangeStart('7d', now)!.toISOString(), '2026-11-11T18:30:00.000Z');
  assert.equal(rangeStart('all', now), null);
  assert.equal(parseRange('nonsense'), '30d');
});

test('only confirmed, packed, shipped and delivered orders count as sales; refunds apart', () => {
  const s = summarise(
    [
      order({ number: 'A', total_inr: 8100 }),
      order({ number: 'B', status: 'delivered', payment_method: 'cod', total_inr: 12000, items: [{ product_slug: 'gown', name: 'Gown', qty: 2, unit_price_inr: 6000 }] }),
      order({ number: 'C', status: 'pending_payment', total_inr: 99999 }),
      order({ number: 'D', status: 'refunded', total_inr: 5000 }),
      order({ number: 'E', status: 'expired', total_inr: 7000 }),
    ],
    '7d',
    now,
  );
  assert.equal(s.revenue, 20100);
  assert.equal(s.orders, 2);
  assert.equal(s.average, 10050);
  assert.equal(s.units, 3);
  assert.deepEqual(s.refunds, { orders: 1, total: 5000 });
  assert.deepEqual(s.payment, [
    { method: 'online', orders: 1, revenue: 8100 },
    { method: 'cod', orders: 1, revenue: 12000 },
  ]);
  assert.equal(s.best[0].slug, 'gown'); // ranked by revenue
  assert.equal(s.byStatus.reduce((n, x) => n + x.count, 0), 5);
});

test('the daily chart has one bar per India day, today last, sales on the right day', () => {
  const s = summarise([order({ placed_at: '2026-11-17T19:00:00Z' })], '7d', now); // 00:30 IST on the 18th
  assert.equal(s.series.by, 'day');
  assert.equal(s.series.points.length, 7);
  assert.equal(s.series.points.at(-1)!.key, '2026-11-18');
  assert.equal(s.series.points.at(-1)!.revenue, 8100);
  assert.equal(s.series.points.at(-2)!.revenue, 0);
});

test('all time is charted by month, from the first sale to this month', () => {
  const s = summarise([order({ placed_at: '2026-09-10T05:00:00Z' })], 'all', now);
  assert.equal(s.series.by, 'month');
  assert.deepEqual(s.series.points.map((p) => p.key), ['2026-09', '2026-10', '2026-11']);
});

test('the chart scale rounds up to 1, 2 or 5 times a power of ten', () => {
  assert.equal(niceMax(8100), 10000);
  assert.equal(niceMax(14000), 20000);
  assert.equal(niceMax(41000), 50000);
  assert.equal(niceMax(0), 1000);
});

test('CSV: quoting, numbers, and formulas neutralised', () => {
  assert.equal(csvCell('Rao, Ananya'), '"Rao, Ananya"');
  assert.equal(csvCell('She said "hi"'), '"She said ""hi"""');
  assert.equal(csvCell(8100), '8100');
  assert.equal(csvCell(null), '');
  assert.equal(csvCell('=HYPERLINK("x")'), `"'=HYPERLINK(""x"")"`);
  assert.equal(csvCell('@SUM(1)'), `'@SUM(1)`);
  assert.equal(csvCell('+91 9876543210'), `'+91 9876543210`);
  assert.ok(toCsv(['a'], [[1]]).startsWith('﻿a\r\n1'));
});
