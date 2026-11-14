'use client';

import { useEffect, useState } from 'react';
import { formatPrice } from '@/lib/format';
import { FREE_SHIPPING_CENTS } from '@/lib/products';
import styles from './FreeShippingBar.module.css';

/**
 * "€x away from free shipping" with a thin line that fills as the bag grows. The line only
 * moves with transform (scaleX), easing in when it first appears and each time the bag changes.
 */
export function FreeShippingBar({ subtotal }: { subtotal: number }) {
  const progress = Math.min(1, subtotal / FREE_SHIPPING_CENTS);
  const done = subtotal >= FREE_SHIPPING_CENTS;
  // Starts empty and fills on the next frame, so it animates in rather than appearing full.
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(progress));
    return () => cancelAnimationFrame(id);
  }, [progress]);

  return (
    <div className={styles.bar} data-done={done || undefined}>
      <p className={styles.text} role="status">
        {done ? (
          'You’ve unlocked free shipping.'
        ) : (
          <>
            You’re <strong>{formatPrice(FREE_SHIPPING_CENTS - subtotal)}</strong> away from free shipping.
          </>
        )}
      </p>
      <div
        className={styles.track}
        role="progressbar"
        aria-label="Progress towards free shipping"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <span className={styles.fill} style={{ transform: `scaleX(${shown})` }} />
      </div>
    </div>
  );
}
