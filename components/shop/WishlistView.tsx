'use client';

import Link from 'next/link';
import { products } from '@/lib/products';
import { useStore } from '@/lib/store';
import { ProductGrid } from '../plp/ProductGrid';
import styles from './Simple.module.css';

/** Wishlist. EXTRAPOLATED – no reference design. Saved in this browser until accounts exist. */
export function WishlistView() {
  const { wishlist } = useStore();
  const saved = products.filter((p) => wishlist.includes(p.slug));

  return (
    <>
      <div className={styles.head}>
        <h1 className="page-title">Wishlist</h1>
        {saved.length > 0 && (
          <p className="muted">
            {saved.length} {saved.length === 1 ? 'piece' : 'pieces'} saved
          </p>
        )}
      </div>
      {saved.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>Tap the heart on any piece to keep it here.</p>
          <Link href="/new-arrivals" className="btn btn-black">
            Shop new arrivals
          </Link>
        </div>
      ) : (
        <div className={styles.bleed}>
          <ProductGrid products={saved} />
        </div>
      )}
    </>
  );
}
