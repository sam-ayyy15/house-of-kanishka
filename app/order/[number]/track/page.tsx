import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Emblem } from '@/components/Emblem';
import { Eyebrow } from '@/components/Eyebrow';
import { Handwriting } from '@/components/Handwriting';
import { Header } from '@/components/Header';
import styles from '@/components/order/Track.module.css';
import { signedInUserId } from '@/lib/customer';
import { orderStatusLabel } from '@/lib/order-status';
import { canViewOrder, getOrder, isUuid, orderUrl, type ShipTo } from '@/lib/orders';

export const metadata: Metadata = {
  title: 'Track your order · House of Kanishka',
  robots: { index: false, follow: false },
};

const when = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date(iso)) : null;

const REACHED: Record<string, number> = { pending_payment: 0, awaiting_confirmation: 0, confirmed: 1, packed: 2, shipped: 3, delivered: 4 };

/**
 * The journey of one order, in the house's own words. EXTRAPOLATED – no reference design
 * (DESIGN_GUIDE.md §6 "Tracking timeline"): a fine vertical line that fills in red down to
 * the current stage, with a small lotus opening at each stage as the line reaches it.
 * The stages come from what the founder records in the admin area.
 */
export default async function TrackOrderPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ t?: string }> }) {
  const [{ number }, { t }, userId] = await Promise.all([params, searchParams, signedInUserId()]);
  const order = await getOrder(number);
  if (!order || !canViewOrder(order, { userId, token: isUuid(t) ? t : undefined })) notFound();

  const to = order.ship_to as ShipTo;
  const reached = REACHED[order.status];
  const stopped = reached === undefined; // cancelled, lapsed or refunded
  const cod = order.payment_method === 'cod';

  const stages = [
    {
      title: 'Order placed',
      at: order.placed_at,
      note: order.status === 'awaiting_confirmation' ? 'Waiting for you to confirm it from our email.' : order.status === 'pending_payment' ? 'Waiting for the payment to complete.' : null,
    },
    { title: 'Confirmed', at: order.confirmed_at, note: cod ? 'To be paid in cash on delivery.' : 'Payment received.' },
    { title: 'Packed with care', at: order.packed_at, note: 'Checked, pressed and wrapped by hand.' },
    {
      title: 'On its way',
      at: order.shipped_at,
      note: order.courier ? `With ${order.courier}${order.tracking_number ? `, tracking number ${order.tracking_number}` : ''}.` : 'Handed to the courier.',
    },
    { title: 'Delivered', at: order.delivered_at, note: `To ${to.city}.` },
  ];
  const script = stopped ? orderStatusLabel(order.status) : ['Thank you', 'Confirmed', 'Packed', 'On its way', 'Delivered'][reached];
  const pieces = order.items.reduce((n, i) => n + i.qty, 0);

  return (
    <>
      <Header />
      <main className={styles.page}>
        <div className={styles.intro}>
          <Eyebrow>Order {order.number}</Eyebrow>
          <p className={styles.script} data-write="load" style={{ '--write-delay': '300ms' } as React.CSSProperties}>
            <Handwriting text={script} />
          </p>
          <h1 className={styles.title}>
            {stopped
              ? 'This order is no longer on its way'
              : reached === 4
                ? 'Your pieces have arrived'
                : reached === 3
                  ? 'Your pieces are travelling to you'
                  : 'We are preparing your pieces'}
          </h1>
          <p className={styles.lede}>
            {pieces} {pieces === 1 ? 'piece' : 'pieces'} for {to.full_name}, {to.city} {to.pincode}.
          </p>
          <div className={styles.links}>
            {order.status === 'shipped' && order.tracking_url && (
              <a href={order.tracking_url} className="btn btn-black" target="_blank" rel="noreferrer">
                Follow with the courier
              </a>
            )}
            <Link href={orderUrl(order)} className="text-link">
              View bill
            </Link>
            <Link href="/contact" className="text-link">
              Need help?
            </Link>
          </div>
        </div>

        {stopped ? (
          <div className={styles.stopped}>
            <Emblem bloom="load" className={styles.stoppedEmblem} />
            <p>
              {order.status === 'refunded'
                ? 'This order was refunded to the original payment method. Banks usually show it within 5 to 7 working days.'
                : 'This order was closed and its pieces were released. If anything was paid, it is returned to the original payment method.'}
            </p>
          </div>
        ) : (
          <ol className={styles.timeline} aria-label="Order progress">
            {stages.map((s, i) => {
              const done = i <= reached;
              return (
                <li
                  key={s.title}
                  className={styles.stage}
                  data-done={done || undefined}
                  data-current={i === reached || undefined}
                  aria-current={i === reached ? 'step' : undefined}
                  style={{ '--i': i } as React.CSSProperties}
                >
                  <span className={styles.marker} aria-hidden="true">
                    {done ? <Emblem bloom="load" delay={500 + i * 380} /> : <i />}
                  </span>
                  {/* The red line from this stage down to the next one it has reached. */}
                  {i < reached && <span className={styles.fill} aria-hidden="true" />}
                  <div className={styles.stageText}>
                    <h2 className={styles.stageTitle}>{s.title}</h2>
                    {done && when(s.at) && <p className={styles.stageWhen}>{when(s.at)}</p>}
                    {done && s.note && <p className={styles.stageNote}>{s.note}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </main>
    </>
  );
}
