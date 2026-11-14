'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/format';
import { FREE_SHIPPING_CENTS, getProduct, productHref } from '@/lib/products';
import { setQty, useStore } from '@/lib/store';
import { FreeShippingBar } from '../bag/FreeShippingBar';
import { Emblem } from '../Emblem';
import styles from './BagView.module.css';

/** Resolved bag lines and subtotal, shared by the bag and checkout pages. */
export function useBag() {
  const { bag } = useStore();
  const lines = bag.flatMap((l) => {
    const product = getProduct(l.slug);
    return product ? [{ ...l, product }] : [];
  });
  const subtotal = lines.reduce((n, l) => n + l.product.priceCents * l.qty, 0);
  return { lines, subtotal, freeShipping: subtotal >= FREE_SHIPPING_CENTS };
}

/** Shopping bag. EXTRAPOLATED – no reference design. */
export function BagView() {
  const { lines, subtotal, freeShipping } = useBag();

  if (lines.length === 0) {
    return (
      <div className={styles.empty}>
        <Emblem bloom="load" className={styles.emptyEmblem} />
        <h1 className="page-title">Your bag is empty</h1>
        <Link href="/new-arrivals" className="btn btn-black">
          Shop new arrivals
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <div>
        <h1 className="page-title">Shopping Bag</h1>
        <ul className={styles.lines}>
          {lines.map(({ product, size, qty }) => (
            <li key={`${product.slug}-${size}`} className={styles.line}>
              <Link href={productHref(product)} className={styles.thumb} aria-label={product.name}>
                <Image src={product.image} alt="" fill sizes="120px" />
              </Link>
              <div className={styles.lineInfo}>
                <Link href={productHref(product)} className={styles.name}>
                  {product.name}
                </Link>
                <p className="muted">
                  {product.colour} · {size}
                </p>
                <div className={styles.qty}>
                  <button type="button" aria-label={`Decrease quantity of ${product.name}`} onClick={() => setQty(product.slug, size, qty - 1)}>
                    −
                  </button>
                  <span aria-live="polite">{qty}</span>
                  <button type="button" aria-label={`Increase quantity of ${product.name}`} onClick={() => setQty(product.slug, size, qty + 1)}>
                    +
                  </button>
                </div>
              </div>
              <div className={styles.lineEnd}>
                <p className={styles.price}>{formatPrice(product.priceCents * qty)}</p>
                <button type="button" className="text-link" onClick={() => setQty(product.slug, size, 0)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <aside className={styles.summary} aria-label="Order summary">
        <dl className={styles.totals}>
          <div>
            <dt>Subtotal</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          <div>
            <dt>Shipping</dt>
            <dd>{freeShipping ? 'Free' : 'Calculated at checkout'}</dd>
          </div>
        </dl>
        <FreeShippingBar subtotal={subtotal} />
        <Link href="/checkout" className="btn btn-red btn-split">
          <span>Checkout</span>
          <span>{formatPrice(subtotal, { withCode: true })}</span>
        </Link>
        <Link href="/new-arrivals" className="text-link">
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}
