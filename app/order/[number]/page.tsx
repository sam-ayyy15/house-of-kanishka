import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Emblem } from '@/components/Emblem';
import { Header } from '@/components/Header';
import { Invoice } from '@/components/order/Invoice';
import styles from '@/components/order/Order.module.css';
import { PaymentWaiting } from '@/components/order/PaymentWaiting';
import { BUSINESS } from '@/lib/business';
import { signedInUserId } from '@/lib/customer';
import { emailConfigured } from '@/lib/email';
import { canViewOrder, getOrder, isUuid, type ShipTo } from '@/lib/orders';

export const metadata: Metadata = {
  title: 'Your order · House of Kanishka',
  robots: { index: false, follow: false },
};

/**
 * One order: the confirmation and bill a customer lands on after checkout, and comes back to
 * from their emails or account. Opened with the private link (?t=…) or by the signed-in
 * owner; to anyone else the page does not exist.
 */
export default async function OrderPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ t?: string }> }) {
  const [{ number }, { t }, userId] = await Promise.all([params, searchParams, signedInUserId()]);
  const order = await getOrder(number);
  if (!order || !canViewOrder(order, { userId, token: isUuid(t) ? t : undefined })) notFound();

  if (order.status === 'pending_payment') {
    return (
      <>
        <Header />
        <main className={styles.quiet}>
          <PaymentWaiting number={order.number} token={order.access_token} />
        </main>
      </>
    );
  }

  if (order.status === 'expired' || order.status === 'cancelled') {
    return (
      <>
        <Header />
        <main className={styles.quiet}>
          <Emblem bloom="load" className={styles.quietEmblem} />
          <h1 className={styles.quietTitle}>{order.status === 'expired' ? 'This order has lapsed' : 'This order was cancelled'}</h1>
          <p className={styles.quietText}>
            {order.payment_method === 'cod'
              ? 'It was not confirmed in time, so the pieces were released. Nothing is owed.'
              : 'The payment was not completed in time, so the pieces were released. Nothing has been charged.'}{' '}
            You are welcome to order again.
          </p>
          <Link href="/new-arrivals" className="btn btn-black">
            Shop new arrivals
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main>
        <Invoice
          order={{
            number: order.number,
            token: order.access_token,
            confirmEmailSent: !!order.confirm_email_sent_at,
            placedAt: order.placed_at,
            status: order.status,
            paymentMethod: order.payment_method as 'online' | 'cod',
            paid: order.payment_status === 'paid',
            email: order.email,
            phone: order.phone,
            shipTo: order.ship_to as ShipTo,
            subtotal: order.subtotal_inr,
            shipping: order.shipping_inr,
            total: order.total_inr,
            items: order.items.map((i) => ({ id: i.id, name: i.name, size: i.size, colour: i.colour, qty: i.qty, unitPrice: i.unit_price_inr })),
          }}
          seller={{ name: BUSINESS.legalName, address: [...BUSINESS.address], email: BUSINESS.email }}
          signedIn={!!userId}
          emailed={emailConfigured}
        />
      </main>
    </>
  );
}
