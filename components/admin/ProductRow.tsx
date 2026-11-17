'use client';

import { useActionState } from 'react';
import { saveProduct, type AdminState } from '@/app/actions/admin';
import { LOW_STOCK } from '@/lib/products';
import { keepValues } from '../form/keep';
import { SubmitButton } from '../form/SubmitButton';
import styles from './Admin.module.css';

type Props = {
  index: number;
  product: {
    id: string;
    slug: string;
    name: string;
    category_slug: string;
    price_inr: number;
    status: string;
    variants: { id: string; size: string; stock: number }[];
  };
};

/** One piece on the Stock page: price, status and the stock of each size, saved together. */
export function ProductRow({ product, index }: Props) {
  const [state, action, pending] = useActionState<AdminState, FormData>(saveProduct, null);
  return (
    <form onSubmit={keepValues(action)} className={styles.product} style={{ '--i': index } as React.CSSProperties}>
      <input type="hidden" name="product_id" value={product.id} />
      <div className={styles.productInfo}>
        <p className={styles.productName}>{product.name}</p>
        <p className={styles.muted}>{product.variants.reduce((n, v) => n + v.stock, 0)} in stock</p>
      </div>
      <label className={styles.mini}>
        <span className={styles.label}>Price ₹</span>
        <input name="price" type="number" inputMode="numeric" min={1} step={1} defaultValue={product.price_inr} required />
      </label>
      <label className={styles.mini}>
        <span className={styles.label}>Status</span>
        <select className="house" name="status" defaultValue={product.status}>
          <option value="live">On sale</option>
          <option value="preview">Preview</option>
          <option value="draft">Hidden</option>
        </select>
      </label>
      <div className={styles.sizes}>
        {product.variants.map((v) => (
          <label key={v.id} className={styles.mini}>
            <span className={styles.label}>{v.size}</span>
            <input
              name={`stock:${v.id}`}
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              defaultValue={v.stock}
              data-low={v.stock <= LOW_STOCK || undefined}
              required
            />
          </label>
        ))}
      </div>
      <div className={styles.saveCell}>
        <SubmitButton pending={pending} busyLabel="Saving…" className="btn btn-outline">
          Save
        </SubmitButton>
        {state && (
          <span key={String(pending)} className={styles.saved} data-bad={!state.ok || undefined} role="status">
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}
