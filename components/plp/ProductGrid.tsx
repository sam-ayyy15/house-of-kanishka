import Image from 'next/image';
import Link from 'next/link';
import { altImage, productHref, type Product } from '@/lib/products';
import { ProductCaption } from '../ProductCaption';
import { QuickViewButton } from './QuickViewButton';
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

/**
 * Cut-out product grid (spec §5): 5 columns desktop, 2 mobile. Hovering a card fades in a
 * second photo (where the piece has one), and QUICK VIEW slides in beside the price under the
 * photo; on touch screens a small + sits there instead. Nothing is ever drawn over the photo.
 */
export function ProductGrid({ products, captions = 'always', columns = 5 }: Props) {
  return (
    <ul
      className={styles.grid}
      data-captions={captions}
      data-columns={columns}
      // A grid of objects only (accessories) uses 4:5 tiles instead of full-length boxes.
      data-tiles={products.every((p) => p.card === 'tile') || undefined}
    >
      {products.map((p, i) => {
        const alt = altImage(p);
        return (
          // Cards rise in on first view, one after another across the row.
          <li key={p.slug} data-reveal="rise" style={{ '--reveal-delay': `${(i % columns) * 70}ms` } as React.CSSProperties}>
            <div className={styles.card}>
              <div className={styles.frame}>
                <Link href={productHref(p)} className={styles.mediaLink} aria-label={p.name}>
                  <div className={styles.media} data-card={p.card}>
                    <Image src={p.image} alt="" fill sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 20vw" />
                    {alt && (
                      <Image
                        src={alt.src}
                        alt=""
                        fill
                        sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 20vw"
                        className={styles.second}
                        data-fit={alt.fit}
                      />
                    )}
                  </div>
                </Link>
              </div>
              {/* Under the photo, never over it: the caption, and QUICK VIEW sliding in on its price line. */}
              <div className={styles.meta}>
                {/* The caption repeats the link; the photo link above is the one in the tab order. */}
                <Link href={productHref(p)} className={styles.captionLink} tabIndex={-1} aria-hidden="true">
                  <ProductCaption name={p.name} priceCents={p.priceCents} className={styles.caption} />
                </Link>
                <QuickViewButton slug={p.slug} name={p.name} className={styles.quick} />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
