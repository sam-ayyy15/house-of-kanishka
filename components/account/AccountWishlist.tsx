'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/format';
import { toggleWishlist, useStore } from '@/lib/store';
import { useCatalog } from '../CatalogProvider';
import { Emblem } from '../Emblem';
import styles from './Account.module.css';

/** The saved wishlist as a quiet list: photo, name, price, and a way to remove it. */
export function AccountWishlist() {
  const { wishlist } = useStore();
  const { products } = useCatalog();
  const saved = products.filter((p) => wishlist.includes(p.slug));

  if (saved.length === 0) {
    return (
      <div className={styles.empty}>
        <Emblem bloom="load" className={styles.emptyEmblem} />
        <p className={styles.serif}>Tap the heart on any piece to keep it here.</p>
        <Link href="/new-arrivals" className="btn btn-black">
          Shop new arrivals
        </Link>
      </div>
    );
  }

  return (
    <ul className={styles.pieces}>
      {saved.map((p) => (
        <li key={p.slug} className={styles.piece}>
          <Link href={`/products/${p.slug}`} className={styles.thumb} tabIndex={-1} aria-hidden="true">
            {/* Placeholder: local-only photo. Never ship. */}
            <Image src={p.image} alt="" fill sizes="84px" />
          </Link>
          <div>
            <Link href={`/products/${p.slug}`} className={styles.pieceName}>
              {p.name}
            </Link>
            <p className={styles.pieceMeta}>
              {formatPrice(p.price)} · {p.colour}
            </p>
          </div>
          <button type="button" className="text-link" onClick={() => toggleWishlist(p.slug)}>
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}
