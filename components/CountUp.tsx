'use client';

import { useEffect, useRef, useState } from 'react';
import { formatPrice } from '@/lib/format';

/**
 * A rupee amount that counts up to its value when it first appears, and glides to the new
 * value whenever it changes. With reduced motion it simply shows the amount.
 */
export function CountUp({
  value,
  duration = 900,
  delay = 0,
  withCode = false,
  plain = false,
}: {
  value: number;
  duration?: number;
  delay?: number;
  withCode?: boolean;
  /** A bare number (a count) instead of a rupee amount. */
  plain?: boolean;
}) {
  const show = (n: number) => (plain ? String(n) : formatPrice(n, { withCode }));
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = from.current;
    let frame = 0;
    let t0 = 0;
    const tick = (now: number) => {
      t0 ||= now + delay;
      const p = Math.min(1, Math.max(0, (now - t0) / duration));
      const eased = 1 - Math.pow(1 - p, 4); // the site's ease-out
      const current = Math.round(start + (value - start) * eased);
      from.current = current;
      setShown(current);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, delay]);

  return (
    <>
      <span className="visually-hidden">{show(value)}</span>
      <span aria-hidden="true" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {show(shown)}
      </span>
    </>
  );
}
