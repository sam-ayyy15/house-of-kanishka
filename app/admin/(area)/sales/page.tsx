import { SalesView } from '@/components/admin/SalesView';
import { requireAdmin } from '@/lib/admin-gate';
import { parseRange, rangeStart, summarise, type SaleOrder } from '@/lib/sales';
import { adminDb } from '@/lib/supabase/server';

/** Sales: revenue, orders, best sellers and how customers paid, for a chosen period. */
export default async function AdminSalesPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  await requireAdmin('/admin/sales');
  const range = parseRange((await searchParams).range);
  const start = rangeStart(range);
  let query = adminDb()
    .from('orders')
    .select('number, status, payment_method, total_inr, placed_at, items:order_items(product_slug, name, qty, unit_price_inr)')
    .order('placed_at', { ascending: true })
    .limit(10_000);
  if (start) query = query.gte('placed_at', start.toISOString());
  const { data } = await query;
  return <SalesView range={range} summary={summarise((data ?? []) as SaleOrder[], range)} />;
}
