import Image from 'next/image';
import Link from 'next/link';
import { productHref, type Product } from '@/lib/products';
import { ProductCaption } from '../ProductCaption';
import styles from './ProductGrid.module.css';

type Props = {
  products: Product[];
  /**
   * 'hover': image-only as in S2; name and price fade in on hover or keyboard focus
   * (desktop only; mobile stays image-only as in the mockup).
   * 'always': name and price always shown under the image.
   */
  captions?: 'hover' | 'always';
  columns?: 5 | 4;
};

/** Cut-out product grid (spec §5): 5 columns desktop, 2 mobile. */
export function ProductGrid({ products, captions = 'always', columns = 5 }: Props) {
  return (
    <ul
      className={styles.grid}
      data-captions={captions}
      data-columns={columns}
      // A grid of objects only (accessories) uses 4:5 tiles instead of full-length boxes.
      data-tiles={products.every((p) => p.card === 'tile') || undefined}
    >
      {products.map((p, i) => (
        // Cards rise in on first view, one after another across the row.
        <li key={p.slug} data-reveal="rise" style={{ '--reveal-delay': `${(i % columns) * 70}ms` } as React.CSSProperties}>
          <Link href={productHref(p)} className={styles.card}>
            <div className={styles.media} data-card={p.card}>
              <Image src={p.image} alt={p.name} fill sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 20vw" />
            </div>
            <ProductCaption name={p.name} priceCents={p.priceCents} className={styles.caption} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
