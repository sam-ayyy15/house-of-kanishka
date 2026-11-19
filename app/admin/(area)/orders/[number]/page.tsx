import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from '@/components/admin/Admin.module.css';
import { OrderActions } from '@/components/admin/OrderActions';
import { requireAdmin } from '@/lib/admin-gate';
import { delhiveryConfigured, getParcelDefaults } from '@/lib/delhivery';
import { carrierWords, EWAYBILL_FROM_INR, placeName } from '@/lib/delhivery-core';
import { formatPrice } from '@/lib/format';
import { orderStatusLabel } from '@/lib/order-status';
import { getOrder, orderUrl, type ShipTo } from '@/lib/orders';

const when = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date(iso)) : null;
const day = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' }).format(new Date(iso)) : null;

export default async function AdminOrderPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  await requireAdmin(`/admin/orders/${encodeURIComponent(number)}`);
  const order = await getOrder(number);
  if (!order) notFound();
  const to = order.ship_to as ShipTo;
  const parcel = order.status === 'packed' && !order.shipment_booked_at && delhiveryConfigured ? await getParcelDefaults() : null;
  const words = carrierWords(order.carrier_status, order.carrier_status_type);
  const delhivery = {
    configured: delhiveryConfigured,
    booked: !!order.shipment_booked_at,
    waybill: order.courier === 'Delhivery' ? order.tracking_number : null,
    weightG: order.parcel_weight_g ?? parcel?.weightG ?? 500,
    needsEwaybill: order.total_inr >= EWAYBILL_FROM_INR,
    latest: words ? { words, where: placeName(order.carrier_location), when: when(order.carrier_status_at) } : null,
    expected: order.status === 'shipped' ? day(order.carrier_expected_at) : null,
    synced: when(order.carrier_synced_at),
  };
  const steps: [string, string | null][] = [
    ['Placed', order.placed_at],
    ['Confirmed', order.confirmed_at],
    ['Paid', order.paid_at],
    ['Packed', order.packed_at],
    ['Shipped', order.shipped_at],
    ['Delivered', order.delivered_at],
    ['Cancelled', order.cancelled_at],
    ['Refunded', order.refunded_at],
  ];

  return (
    <>
      <header className={styles.head}>
        <div>
          <p className={styles.sub}>
            <Link href="/admin/orders">Orders</Link> /
          </p>
          <h1 className={styles.title}>{order.number}</h1>
        </div>
        <p>
          <span className={styles.tag} data-tone="black">
            {orderStatusLabel(order.status)}
          </span>{' '}
          <span className={styles.tag}>
            {order.payment_method === 'cod' ? 'Cash on delivery' : 'Online'} · {order.payment_status}
          </span>
        </p>
      </header>

      {order.needs_attention && <p className={styles.attention}>{order.needs_attention}</p>}

      <div className={styles.cols}>
        <div>
          <div className={styles.block}>
            <p className={styles.label}>Pieces</p>
            <ul className={styles.lines}>
              {order.items.map((i) => (
                <li key={i.id}>
                  <span>
                    {i.name} · {[i.colour, i.size].filter(Boolean).join(' · ')} × {i.qty}
                  </span>
                  <span>{formatPrice(i.unit_price_inr * i.qty)}</span>
                </li>
              ))}
              <li>
                <span>Shipping</span>
                <span>{order.shipping_inr === 0 ? 'Free' : formatPrice(order.shipping_inr)}</span>
              </li>
              <li data-total>
                <span>{order.payment_method === 'cod' && order.payment_status !== 'paid' ? 'To collect' : 'Total'}</span>
                <span>{formatPrice(order.total_inr, { withCode: true })}</span>
              </li>
            </ul>
          </div>
          <div className={styles.block}>
            <p className={styles.label}>Deliver to</p>
            <p>
              {to.full_name}
              <br />
              {to.line1}
              {to.line2 ? `, ${to.line2}` : ''}
              <br />
              {to.city}, {to.state} {to.pincode}
            </p>
          </div>
          <div className={styles.block}>
            <p className={styles.label}>Customer</p>
            <p>
              <a href={`mailto:${order.email}`}>{order.email}</a> · <a href={`tel:+91${order.phone}`}>+91 {order.phone}</a>
              <br />
              <span className={styles.muted}>{order.clerk_user_id ? 'Has an account' : 'Guest checkout'}</span>
            </p>
          </div>
          <div className={styles.block}>
            <p className={styles.label}>History</p>
            <ul className={styles.lines}>
              {steps
                .filter(([, at]) => at)
                .map(([label, at]) => (
                  <li key={label}>
                    <span>{label}</span>
                    <span className={styles.muted}>{when(at)}</span>
                  </li>
                ))}
            </ul>
            {order.courier && (
              <p>
                {order.courier}
                {order.tracking_number ? ` · ${order.tracking_number}` : ''}
              </p>
            )}
            <p>
              <Link href={orderUrl(order)} className="text-link">
                Customer’s bill
              </Link>
            </p>
          </div>
        </div>

        <OrderActions number={order.number} status={order.status} paidOnline={order.payment_method === 'online' && order.payment_status === 'paid'} note={order.admin_note ?? ''} hasAttention={!!order.needs_attention} delhivery={delhivery} />
      </div>
    </>
  );
}
