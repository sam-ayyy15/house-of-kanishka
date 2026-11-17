'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { formatPrice } from '@/lib/format';
import { colourwaysOf, productHref, stockOf, type Product } from '@/lib/products';
import { useCatalog } from '../CatalogProvider';
import { addToBag } from '@/lib/store';
import { closeQuickView, openMiniBag, useUI } from '@/lib/ui';
import { Drawer } from '../Drawer';
import styles from './QuickView.module.css';

function Body({ product }: { product: Product }) {
  const oneSize = product.sizes.length === 1;
  const [size, setSize] = useState<string | null>(oneSize ? product.sizes[0] : null);
  const colours = colourwaysOf(product);

  return (
    <div className={styles.wrap}>
      <div className={styles.media} data-card={product.card}>
        <Image src={product.image} alt={product.name} fill sizes="(max-width: 767px) 80vw, 420px" priority />
      </div>

      <h2 className={styles.name}>{product.name}</h2>
      <p className={styles.price}>{formatPrice(product.price)}</p>

      <p className={styles.label}>
        Colour <span>{colours.map((c) => c.name).join(', ')}</span>
      </p>

      {!oneSize && (
        <fieldset className={styles.sizes}>
          <legend className={styles.label}>Size</legend>
          <div className={styles.chips}>
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                className={styles.chip}
                aria-pressed={size === s}
                disabled={stockOf(product, s) <= 0}
                aria-label={stockOf(product, s) <= 0 ? `${s}, sold out` : undefined}
                onClick={() => setSize(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <button
        type="button"
        className={`btn btn-red btn-split ${styles.add}`}
        aria-disabled={!size}
        onClick={() => {
          if (!size) return;
          addToBag(product.slug, size);
          closeQuickView();
          openMiniBag();
        }}
      >
        <span aria-live="polite">{size ? 'Add to cart' : 'Select a size'}</span>
        <span>{formatPrice(product.price, { withCode: true })}</span>
      </button>

      <Link href={productHref(product)} className="text-link" onClick={closeQuickView}>
        View full details
      </Link>
    </div>
  );
}

/** Quick view: pick a size and add to the bag without leaving the grid. Opened from a product card. */
export function QuickView() {
  const { quick } = useUI();
  const { get } = useCatalog();
  const current = quick ? get(quick) : undefined;
  // Keep the last product while the panel slides out.
  const last = useRef<Product | undefined>(undefined);
  if (current) last.current = current;
  const shown = current ?? last.current;

  return (
    <Drawer open={!!current} onClose={closeQuickView} side="right" label="Quick view">
      {shown && <Body key={shown.slug} product={shown} />}
    </Drawer>
  );
}
