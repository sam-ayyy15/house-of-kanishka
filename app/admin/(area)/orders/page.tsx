import Link from 'next/link';
import styles from '@/components/admin/Admin.module.css';
import { requireFounder } from '@/lib/founder';
import { formatPrice } from '@/lib/format';
import { orderDate, orderStatusLabel } from '@/lib/order-status';
import { adminDb } from '@/lib/supabase/server';

const FILTERS = [
  ['all', 'All'],
  ['confirmed', 'To pack'],
  ['packed', 'To ship'],
  ['shipped', 'On the way'],
  ['delivered', 'Delivered'],
  ['awaiting_confirmation', 'Awaiting COD'],
  ['pending_payment', 'Awaiting payment'],
  ['closed', 'Cancelled / lapsed / refunded'],
  ['attention', 'Need attention'],
] as const;

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireFounder();
  const { status = 'all' } = await searchParams;
  const active = FILTERS.some(([key]) => key === status) ? status : 'all';

  let query = adminDb()
    .from('orders')
    .select('number, placed_at, status, payment_method, payment_status, total_inr, email, ship_to, needs_attention')
    .order('placed_at', { ascending: false })
    .limit(200);
  if (active === 'closed') query = query.in('status', ['cancelled', 'expired', 'refunded']);
  else if (active === 'attention') query = query.not('needs_attention', 'is', null);
  else if (active !== 'all') query = query.eq('status', active);
  const { data } = await query;
  const orders = data ?? [];

  return (
    <>
      <header className={styles.head}>
        <h1 className={styles.title}>Orders</h1>
        <p className={styles.sub}>
          {orders.length} {orders.length === 1 ? 'order' : 'orders'}
          {orders.length === 200 ? ' (latest 200)' : ''}
        </p>
      </header>
      <nav className={styles.filters} aria-label="Filter orders">
        {FILTERS.map(([key, label]) => (
          <Link key={key} href={key === 'all' ? '/admin/orders' : `/admin/orders?status=${key}`} className={styles.filter} aria-current={key === active ? 'page' : undefined}>
            {label}
          </Link>
        ))}
      </nav>
      {orders.length === 0 ? (
        <p className={styles.empty}>No orders here.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Order</th>
                <th className={styles.th}>Placed</th>
                <th className={styles.th}>Customer</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Payment</th>
                <th className={`${styles.th} ${styles.num}`}>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => {
                const to = o.ship_to as { full_name?: string; city?: string };
                return (
                  <tr key={o.number} style={{ '--i': Math.min(i, 12) } as React.CSSProperties}>
                    <td>
                      <Link href={`/admin/orders/${o.number}`} className={styles.rowLink}>
                        {o.number}
                      </Link>
                    </td>
                    <td>{orderDate(o.placed_at)}</td>
                    <td>
                      {to.full_name}, {to.city}
                      <br />
                      <span className={styles.muted}>{o.email}</span>
                    </td>
                    <td>
                      <span className={styles.tag}>{orderStatusLabel(o.status)}</span>
                      {o.needs_attention && (
                        <>
                          {' '}
                          <span className={styles.tag} data-tone="red">
                            Attention
                          </span>
                        </>
                      )}
                    </td>
                    <td>
                      {o.payment_method === 'cod' ? 'COD' : 'Online'} · {o.payment_status}
                    </td>
                    <td className={styles.num}>{formatPrice(o.total_inr)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
