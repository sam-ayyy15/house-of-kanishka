import Image from 'next/image';
import Link from 'next/link';
import { AccountHead } from '@/components/account/AccountHead';
import styles from '@/components/account/Account.module.css';
import { Emblem } from '@/components/Emblem';
import { requireUserId } from '@/lib/customer';
import { formatPrice } from '@/lib/format';
import { orderDate, orderStatusLabel } from '@/lib/order-status';
import { orderUrl } from '@/lib/orders';
import { adminDb } from '@/lib/supabase/server';

/** Order history: one row per order; opening a row shows its pieces and a link to the bill. */
export default async function AccountOrdersPage() {
  const userId = await requireUserId('/account/orders');
  const { data } = await adminDb()
    .from('orders')
    .select('number, access_token, status, payment_method, total_inr, placed_at, items:order_items(id, name, size, qty, unit_price_inr, image)')
    .eq('clerk_user_id', userId)
    .order('placed_at', { ascending: false })
    .limit(50);
  const orders = data ?? [];

  return (
    <>
      <AccountHead title="Orders" />
      {orders.length === 0 ? (
        <div className={styles.empty}>
          <Emblem bloom="load" className={styles.emptyEmblem} />
          <p className={styles.serif}>You have not placed an order yet.</p>
          <Link href="/new-arrivals" className="btn btn-black">
            Shop new arrivals
          </Link>
        </div>
      ) : (
        <ul className={styles.orders}>
          {orders.map((o, k) => (
            <li key={o.number} data-reveal="rise" style={{ '--reveal-delay': `${Math.min(k, 6) * 80}ms` } as React.CSSProperties}>
              <details className={styles.order}>
                <summary>
                  <span className={styles.orderNumber}>{o.number}</span>
                  <span className={styles.orderMeta}>{orderDate(o.placed_at)}</span>
                  <span className={styles.tag}>{orderStatusLabel(o.status)}</span>
                  <span className={styles.orderTotal}>{formatPrice(o.total_inr)}</span>
                  <span className={styles.orderToggle} aria-hidden="true" />
                </summary>
                <div className={styles.orderBody}>
                  <ul>
                    {o.items.map((i) => (
                      <li key={i.id}>
                        <span className={styles.orderThumb}>
                          {/* Placeholder: local-only photo. Never ship. */}
                          {i.image && <Image src={i.image} alt="" fill sizes="56px" />}
                        </span>
                        <span>
                          <span className={styles.orderPiece}>{i.name}</span>
                          <span className="muted">
                            {i.size} · Qty {i.qty}
                          </span>
                        </span>
                        <span>{formatPrice(i.unit_price_inr * i.qty)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="muted">{o.payment_method === 'cod' ? 'Cash on delivery' : 'Paid online'}</p>
                  <div className={styles.orderLinks}>
                    <Link href={`/order/${o.number}/track?t=${o.access_token}`} className="btn btn-black">
                      Track order
                    </Link>
                    <Link href={orderUrl(o)} className="text-link">
                      View bill
                    </Link>
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
