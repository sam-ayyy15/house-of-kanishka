'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { formatPrice } from '@/lib/format';
import { useBag } from './BagView';
import styles from './CheckoutView.module.css';

/**
 * Checkout. EXTRAPOLATED – no reference design.
 * Payment is not connected: the form validates, then says so instead of placing an order.
 */
export function CheckoutView() {
  const { lines, subtotal, freeShipping } = useBag();
  const [submitted, setSubmitted] = useState(false);

  if (lines.length === 0) {
    return (
      <div className={styles.empty}>
        <h1 className="page-title">Nothing to check out yet</h1>
        <Link href="/new-arrivals" className="btn btn-black">
          Shop new arrivals
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
        <h1 className="page-title">Checkout</h1>

        <fieldset className={styles.group}>
          <legend>Contact</legend>
          <label className="field">
            <span>Email</span>
            <input type="email" name="email" autoComplete="email" required />
          </label>
        </fieldset>

        <fieldset className={styles.group}>
          <legend>Delivery</legend>
          <div className={styles.two}>
            <label className="field">
              <span>First name</span>
              <input name="given-name" autoComplete="given-name" required />
            </label>
            <label className="field">
              <span>Last name</span>
              <input name="family-name" autoComplete="family-name" required />
            </label>
          </div>
          <label className="field">
            <span>Address</span>
            <input name="address" autoComplete="street-address" required />
          </label>
          <div className={styles.two}>
            <label className="field">
              <span>Postcode</span>
              <input name="postal-code" autoComplete="postal-code" required />
            </label>
            <label className="field">
              <span>City</span>
              <input name="city" autoComplete="address-level2" required />
            </label>
          </div>
          <label className="field">
            <span>Country</span>
            <input name="country" autoComplete="country-name" required />
          </label>
        </fieldset>

        <fieldset className={styles.group}>
          <legend>Payment</legend>
          <p className="muted">Online payment isn’t connected yet. No card details are collected on this page.</p>
        </fieldset>

        <button type="submit" className="btn btn-red btn-split">
          <span>Place order</span>
          <span>{formatPrice(subtotal, { withCode: true })}</span>
        </button>
        <p className="status" role="status">
          {submitted && 'Your details look good, but orders can’t be placed until payment is connected. Nothing has been charged.'}
        </p>
      </form>

      <aside className={styles.summary} aria-label="Order summary">
        <h2 className={styles.summaryTitle}>Your order</h2>
        <ul className={styles.lines}>
          {lines.map(({ product, size, qty }) => (
            <li key={`${product.slug}-${size}`} className={styles.line}>
              <div className={styles.thumb}>
                <Image src={product.image} alt="" fill sizes="72px" />
              </div>
              <div>
                <p className={styles.name}>{product.name}</p>
                <p className="muted">
                  {size} · Qty {qty}
                </p>
              </div>
              <p className={styles.price}>{formatPrice(product.priceCents * qty)}</p>
            </li>
          ))}
        </ul>
        <dl className={styles.totals}>
          <div>
            <dt>Subtotal</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          <div>
            <dt>Shipping</dt>
            <dd>{freeShipping ? 'Free' : 'To be confirmed'}</dd>
          </div>
        </dl>
        <Link href="/bag" className="text-link">
          Edit bag
        </Link>
      </aside>
    </div>
  );
}
