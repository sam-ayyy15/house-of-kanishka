import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Emblem } from '@/components/Emblem';
import { Header } from '@/components/Header';
import styles from '@/components/order/Order.module.css';
import { isUuid, orderUrl, sendOrderConfirmed } from '@/lib/orders';
import { adminDb } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Confirm your order · House of Kanishka',
  robots: { index: false, follow: false },
};

type Result = { ok: boolean; already?: boolean; error?: string; number?: string; access_token?: string };

/**
 * The link in the cash-on-delivery email: confirms the order and opens its bill. If the
 * order lapsed before it was confirmed, says so calmly.
 */
export default async function CodConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  let result: Result = { ok: false, error: 'not_found' };
  if (isUuid(token)) {
    const { data } = await adminDb().rpc('confirm_cod_order', { p_token: token });
    if (data) result = data as Result;
  }
  if (result.ok && result.number && result.access_token) {
    if (!result.already) await sendOrderConfirmed(result.number);
    redirect(orderUrl({ number: result.number, access_token: result.access_token }));
  }

  const lapsed = result.error === 'expired' || result.error === 'cancelled';
  return (
    <>
      <Header />
      <main className={styles.quiet}>
        <Emblem bloom="load" className={styles.quietEmblem} />
        <h1 className={styles.quietTitle}>{lapsed ? 'This order has lapsed' : 'This link is not valid'}</h1>
        <p className={styles.quietText}>
          {lapsed
            ? `Order ${result.number ?? ''} was not confirmed within 24 hours, so the pieces were released. Nothing is owed, and you are welcome to order again.`
            : 'Please use the link from your most recent email, or write to us and we will help.'}
        </p>
        <Link href={lapsed ? '/new-arrivals' : '/contact'} className="btn btn-black">
          {lapsed ? 'Shop new arrivals' : 'Contact us'}
        </Link>
      </main>
    </>
  );
}
