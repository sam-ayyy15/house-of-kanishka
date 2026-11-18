/**
 * Sales figures for the admin dashboard and exports. Pure functions (no database, no
 * server-only imports) so they can be unit-tested; the page loads the orders and passes them in.
 *
 * A "sale" is an order the shop is fulfilling or has fulfilled: confirmed, packed, shipped or
 * delivered. Refunds are counted separately. Days are India days (Asia/Kolkata).
 */
export type SalesRange = '7d' | '30d' | '90d' | 'all';

export const RANGES: { key: SalesRange; label: string; days: number | null }[] = [
  { key: '7d', label: 'Last 7 days', days: 7 },
  { key: '30d', label: 'Last 30 days', days: 30 },
  { key: '90d', label: 'Last 90 days', days: 90 },
  { key: 'all', label: 'All time', days: null },
];

export const parseRange = (value: unknown): SalesRange => (RANGES.some((r) => r.key === value) ? (value as SalesRange) : '30d');

export const SALE_STATUSES = ['confirmed', 'packed', 'shipped', 'delivered'] as const;
const isSale = (status: string) => (SALE_STATUSES as readonly string[]).includes(status);

const TZ = 'Asia/Kolkata';
/** The India date of a moment, as YYYY-MM-DD. */
export const istDay = (when: string | number | Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(when));
const istMonth = (when: string | number | Date) => istDay(when).slice(0, 7);
const dayStart = (ymd: string) => new Date(`${ymd}T00:00:00+05:30`);
const addDays = (ymd: string, n: number) => istDay(dayStart(ymd).getTime() + n * 86_400_000 + 3_600_000);

/** The first moment of the range (India midnight), or null for all time. */
export function rangeStart(range: SalesRange, now: Date = new Date()): Date | null {
  const days = RANGES.find((r) => r.key === range)?.days;
  if (!days) return null;
  return dayStart(addDays(istDay(now), -(days - 1)));
}

export type SaleOrder = {
  number: string;
  status: string;
  payment_method: string;
  total_inr: number;
  placed_at: string;
  items: { product_slug: string; name: string; qty: number; unit_price_inr: number }[];
};

export type SalesPoint = { key: string; label: string; revenue: number; orders: number };

export type SalesSummary = {
  revenue: number;
  orders: number;
  average: number;
  units: number;
  refunds: { orders: number; total: number };
  byStatus: { status: string; count: number }[];
  payment: { method: 'online' | 'cod'; orders: number; revenue: number }[];
  best: { slug: string; name: string; units: number; revenue: number }[];
  series: { by: 'day' | 'month'; points: SalesPoint[] };
};

const dayLabel = (ymd: string) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: TZ }).format(dayStart(ymd));
const monthLabel = (ym: string) => new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric', timeZone: TZ }).format(dayStart(`${ym}-15`));

/** Every figure on the dashboard, from the orders placed in the range. */
export function summarise(orders: SaleOrder[], range: SalesRange, now: Date = new Date()): SalesSummary {
  const sales = orders.filter((o) => isSale(o.status));
  const revenue = sales.reduce((n, o) => n + o.total_inr, 0);
  const refunded = orders.filter((o) => o.status === 'refunded');

  const statusCount = new Map<string, number>();
  for (const o of orders) statusCount.set(o.status, (statusCount.get(o.status) ?? 0) + 1);

  const best = new Map<string, { slug: string; name: string; units: number; revenue: number }>();
  let units = 0;
  for (const o of sales) {
    for (const i of o.items) {
      units += i.qty;
      const row = best.get(i.product_slug) ?? { slug: i.product_slug, name: i.name, units: 0, revenue: 0 };
      row.units += i.qty;
      row.revenue += i.qty * i.unit_price_inr;
      best.set(i.product_slug, row);
    }
  }

  // The chart: one bar per India day for a set range; one per month for all time.
  const by: 'day' | 'month' = range === 'all' ? 'month' : 'day';
  const keyOf = by === 'day' ? istDay : istMonth;
  const keys: string[] = [];
  if (by === 'day') {
    const start = rangeStart(range, now)!;
    for (let d = istDay(start), end = istDay(now); d <= end; d = addDays(d, 1)) keys.push(d);
  } else {
    const first = sales.length ? sales.reduce((m, o) => (o.placed_at < m ? o.placed_at : m), sales[0].placed_at) : now.toISOString();
    for (let m = istMonth(first), end = istMonth(now); m <= end; ) {
      keys.push(m);
      const [y, mo] = m.split('-').map(Number);
      m = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`;
    }
  }
  const points = new Map<string, SalesPoint>(keys.map((k) => [k, { key: k, label: by === 'day' ? dayLabel(k) : monthLabel(k), revenue: 0, orders: 0 }]));
  for (const o of sales) {
    const p = points.get(keyOf(o.placed_at));
    if (p) {
      p.revenue += o.total_inr;
      p.orders += 1;
    }
  }

  const pay = (method: 'online' | 'cod') => {
    const list = sales.filter((o) => o.payment_method === method);
    return { method, orders: list.length, revenue: list.reduce((n, o) => n + o.total_inr, 0) };
  };

  return {
    revenue,
    orders: sales.length,
    average: sales.length ? Math.round(revenue / sales.length) : 0,
    units,
    refunds: { orders: refunded.length, total: refunded.reduce((n, o) => n + o.total_inr, 0) },
    byStatus: [...statusCount.entries()].map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
    payment: [pay('online'), pay('cod')],
    best: [...best.values()].sort((a, b) => b.revenue - a.revenue || b.units - a.units).slice(0, 8),
    series: { by, points: [...points.values()] },
  };
}

/** A round top for the chart's scale (1, 2 or 5 times a power of ten), never below the data. */
export function niceMax(value: number): number {
  if (value <= 0) return 1000;
  const p = 10 ** Math.floor(Math.log10(value));
  for (const m of [1, 2, 5, 10]) if (m * p >= value) return m * p;
  return 10 * p;
}
