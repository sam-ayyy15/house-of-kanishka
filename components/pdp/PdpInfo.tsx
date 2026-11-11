'use client';

import { useId, useRef, useState } from 'react';
import { formatPrice } from '@/lib/format';
import type { blazer } from '@/lib/products';
import styles from './PdpInfo.module.css';

type Props = { product: typeof blazer };

/**
 * PDP info column (spec §6.1–6.2): tabs, colour and size selects, ADD TO CART with the price
 * inside, and the wishlist button. Cart and wishlist are not wired yet ([M]).
 */
export function PdpInfo({ product }: Props) {
  const tabs = [
    { label: 'Description', body: product.description },
    // Placeholder copy: content for these tabs is [M] (approved).
    { label: 'Details', body: 'Product details will be added here.' },
    {
      label: 'Shipping & Returns',
      body: 'Free shipping on all orders above €350. Hassle-free returns within 30 days of purchase.',
    },
    { label: 'Size Guide', body: 'The size guide will be added here.' },
  ];

  const id = useId();
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // WAI-ARIA tabs: arrow keys move between tabs, Home/End jump to the ends (spec §12.4 #7).
  function onKeyDown(e: React.KeyboardEvent) {
    const last = tabs.length - 1;
    const next =
      e.key === 'ArrowRight' ? (active === last ? 0 : active + 1)
      : e.key === 'ArrowLeft' ? (active === 0 ? last : active - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className={styles.info}>
      <div role="tablist" aria-label="Product information" className={styles.tablist} onKeyDown={onKeyDown}>
        {tabs.map((t, i) => (
          <button
            key={t.label}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={active === i}
            aria-controls={`${id}-panel-${i}`}
            tabIndex={active === i ? 0 : -1}
            className={styles.tab}
            onClick={() => setActive(i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div
          key={t.label}
          role="tabpanel"
          id={`${id}-panel-${i}`}
          aria-labelledby={`${id}-tab-${i}`}
          hidden={active !== i}
          className={styles.panel}
        >
          <p>{t.body}</p>
        </div>
      ))}

      <div className={styles.selects}>
        <label className={styles.select}>
          <span className="visually-hidden">Colour</span>
          <select defaultValue={product.colours[0]}>
            {product.colours.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <span className={styles.swatch} aria-hidden="true" />
        </label>
        <label className={styles.select}>
          <span className="visually-hidden">Size</span>
          <select defaultValue={product.sizes[0]}>
            {product.sizes.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <svg className={styles.chevron} width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="m2 4 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.25" />
          </svg>
        </label>
      </div>

      <div className={styles.purchase}>
        <button type="button" className={styles.addToCart}>
          <span>Add to cart</span>
          <span>{formatPrice(product.priceCents, { withCode: true })}</span>
        </button>
        <button type="button" className={styles.wishlist} aria-label="Add to wishlist">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.4h2c.7-1.3 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"
              fill="var(--vr-red)"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
