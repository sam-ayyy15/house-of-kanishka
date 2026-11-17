import Link from 'next/link';
import styles from '@/components/admin/Admin.module.css';
import { CountUp } from '@/components/CountUp';
import { requireFounder } from '@/lib/founder';
import { formatPrice } from '@/lib/format';
import { orderDate } from '@/lib/order-status';
import { LOW_STOCK } from '@/lib/products';
import { adminDb } from '@/lib/supabase/server';

/** Today: what needs doing, in figures, then the orders waiting to be packed. */
export default async function AdminTodayPage() {
  await requireFounder();
  const db = adminDb();
  const count = (status: string) => db.from('orders').select('id', { count: 'exact', head: true }).eq('status', status);
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const [toPack, toShip, awaiting, onTheWay, attention, messages, low, sales, next, errors] = await Promise.all([
    count('confirmed'),
    count('packed'),
    count('awaiting_confirmation'),
    count('shipped'),
    db.from('orders').select('id', { count: 'exact', head: true }).not('needs_attention', 'is', null),
    db.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    db.from('product_variants').select('id', { count: 'exact', head: true }).lte('stock', LOW_STOCK),
    db.from('orders').select('total_inr').in('status', ['confirmed', 'packed', 'shipped', 'delivered']),
    db.from('orders').select('number, placed_at, total_inr, payment_method, ship_to').eq('status', 'confirmed').order('placed_at').limit(8),
    db.from('error_log').select('id', { count: 'exact', head: true }).gte('created_at', dayAgo),
  ]);
  const total = (sales.data ?? []).reduce((n, o) => n + o.total_inr, 0);

  const figures = [
    { label: 'To pack', value: toPack.count ?? 0, href: '/admin/orders?status=confirmed' },
    { label: 'To ship', value: toShip.count ?? 0, href: '/admin/orders?status=packed' },
    { label: 'On the way', value: onTheWay.count ?? 0, href: '/admin/orders?status=shipped' },
    { label: 'Awaiting COD confirmation', value: awaiting.count ?? 0, href: '/admin/orders?status=awaiting_confirmation' },
    { label: 'Need attention', value: attention.count ?? 0, href: '/admin/orders?status=attention', alert: true },
    { label: 'New messages', value: messages.count ?? 0, href: '/admin/messages', alert: true },
    { label: `Sizes at ${LOW_STOCK} or fewer`, value: low.count ?? 0, href: '/admin/stock' },
    { label: 'Errors, last 24 hours', value: errors.count ?? 0, href: '/admin/errors', alert: true },
  ];

  return (
    <>
      <header className={styles.head}>
        <div>
          <p className={styles.date}>
            {new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' }).format(new Date())}
          </p>
          <h1 className={styles.title}>Today</h1>
        </div>
        <p className={styles.sub}>
          Sales so far (confirmed orders): <CountUp value={total} />
        </p>
      </header>

      <div className={styles.figures}>
        {figures.map((f, i) => (
          <Link key={f.label} href={f.href} className={styles.figure} data-alert={(f.alert && f.value > 0) || undefined} style={{ '--i': i } as React.CSSProperties}>
            <span className={styles.figureLabel}>{f.label}</span>
            <span className={styles.figureValue}>
              <CountUp value={f.value} plain duration={600} />
            </span>
          </Link>
        ))}
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Next to pack</h2>
        {next.data?.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Order</th>
                  <th className={styles.th}>Placed</th>
                  <th className={styles.th}>For</th>
                  <th className={styles.th}>Payment</th>
                  <th className={`${styles.th} ${styles.num}`}>Total</th>
                </tr>
              </thead>
              <tbody>
                {next.data.map((o, i) => {
                  const to = o.ship_to as { full_name?: string; city?: string };
                  return (
                    <tr key={o.number} style={{ '--i': i } as React.CSSProperties}>
                      <td>
                        <Link href={`/admin/orders/${o.number}`} className={styles.rowLink}>
                          {o.number}
                        </Link>
                      </td>
                      <td>{orderDate(o.placed_at)}</td>
                      <td>
                        {to.full_name}, {to.city}
                      </td>
                      <td>{o.payment_method === 'cod' ? 'Cash on delivery' : 'Paid online'}</td>
                      <td className={styles.num}>{formatPrice(o.total_inr)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={styles.empty}>Nothing waiting to be packed.</p>
        )}
      </section>
    </>
  );
}
