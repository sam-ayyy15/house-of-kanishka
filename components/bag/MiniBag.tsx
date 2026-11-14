'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/format';
import { productHref } from '@/lib/products';
import { setQty } from '@/lib/store';
import { closeMiniBag, useUI } from '@/lib/ui';
import { Drawer } from '../Drawer';
import { useBag } from '../shop/BagView';
import { FreeShippingBar } from './FreeShippingBar';
import styles from './MiniBag.module.css';

/**
 * The bag, slid in from the right after something is added (same panel as the menu, from
 * the other edge). EXTRAPOLATED – no reference design: built from the bag page's own parts.
 */
export function MiniBag() {
  const { miniBag } = useUI();
  const { lines, subtotal } = useBag();
  const count = lines.reduce((n, l) => n + l.qty, 0);

  return (
    <Drawer open={miniBag} onClose={closeMiniBag} side="right" label="Shopping bag">
      <div className={styles.wrap}>
        <h2 className={styles.title}>
          Your bag{count > 0 && <span className={styles.count}> ({count})</span>}
        </h2>

        {lines.length === 0 ? (
          <p className={styles.empty}>Your bag is empty.</p>
        ) : (
          <>
            <FreeShippingBar subtotal={subtotal} />
            <ul className={styles.lines}>
              {lines.map(({ product, size, qty }) => (
                <li key={`${product.slug}-${size}`} className={styles.line}>
                  <Link href={productHref(product)} className={styles.thumb} aria-label={product.name} onClick={closeMiniBag}>
                    <Image src={product.image} alt="" fill sizes="88px" />
                  </Link>
                  <div className={styles.info}>
                    <Link href={productHref(product)} className={styles.name} onClick={closeMiniBag}>
                      {product.name}
                    </Link>
                    <p className={styles.meta}>
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
                  <p className={styles.price}>{formatPrice(product.priceCents * qty)}</p>
                </li>
              ))}
            </ul>

            <div className={styles.foot}>
              <p className={styles.subtotal}>
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </p>
              <Link href="/checkout" className="btn btn-red btn-split" onClick={closeMiniBag}>
                <span>Checkout</span>
                <span>{formatPrice(subtotal, { withCode: true })}</span>
              </Link>
              <Link href="/bag" className="btn btn-outline" onClick={closeMiniBag}>
                View bag
              </Link>
            </div>
          </>
        )}

        <button type="button" className={`text-link ${styles.keep}`} onClick={closeMiniBag}>
          Continue shopping
        </button>
      </div>
    </Drawer>
  );
}
