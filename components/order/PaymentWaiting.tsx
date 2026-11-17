'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { orderProgress } from '@/app/actions/checkout';
import { Emblem } from '../Emblem';
import styles from './Order.module.css';

/**
 * Shown when a customer lands on an order whose online payment is not confirmed yet (for
 * example straight back from a UPI app). Asks the server every few seconds; the moment the
 * bank's confirmation arrives the page turns into the bill.
 */
export function PaymentWaiting({ number, token }: { number: string; token: string }) {
  const router = useRouter();
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    let tries = 0;
    const id = window.setInterval(async () => {
      tries += 1;
      const progress = await orderProgress(number, token).catch(() => null);
      if (progress && progress.status !== 'pending_payment') {
        window.clearInterval(id);
        router.refresh();
      } else if (tries >= 30) {
        window.clearInterval(id);
        setGaveUp(true);
      }
    }, 3000);
    return () => window.clearInterval(id);
  }, [number, token, router]);

  return gaveUp ? (
    <>
      <Emblem bloom="none" className={styles.quietEmblem} />
      <h1 className={styles.quietTitle}>We have not received your payment</h1>
      <p className={styles.quietText}>
        If money left your account, it will be matched to order {number} automatically and you will hear from us by email. Otherwise
        nothing has been charged, and your bag is still waiting.
      </p>
      <Link href="/checkout" className="btn btn-outline">
        Back to checkout
      </Link>
    </>
  ) : (
    <div role="status">
      <Emblem bloom="load" className={`${styles.quietEmblem} ${styles.breathing}`} />
      <h1 className={styles.quietTitle}>Confirming your payment</h1>
      <p className={styles.quietText}>Please keep this page open. Order {number} will appear here in a moment.</p>
    </div>
  );
}
