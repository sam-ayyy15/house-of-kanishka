import Image from 'next/image';
import Link from 'next/link';
import { newArrivals, newArrivalsMobile, productHref } from '@/lib/products';
import { ProductCaption } from '../ProductCaption';
import { RiseWords } from '../RiseWords';
import { UnderlineLink } from '../UnderlineLink';
import styles from './NewArrivals.module.css';

/**
 * Homepage §4.2. Desktop: the S4 editorial row (cut-out, oval, framed photo).
 * Mobile: the S3 2-column grid of cut-outs without captions.
 */
export function NewArrivals() {
  const { dress, earrings, framed } = newArrivals;
  return (
    <section className={styles.section} aria-labelledby="new-arrivals-title">
      <div className={styles.head}>
        <h2 id="new-arrivals-title" className={styles.title} data-reveal="words">
          <span className={styles.our}>
            <RiseWords text="Our" />{' '}
          </span>
          <RiseWords text="New Arrivals" from={1} />
        </h2>
        <UnderlineLink href="/new-arrivals">View all</UnderlineLink>
      </div>

      <div className={styles.row}>
        <Link href={productHref(dress)} className={`${styles.item} ${styles.cutout}`} data-reveal="rise">
          <div className={styles.cutoutMedia}>
            <Image src={dress.image} alt={dress.name} fill sizes="30vw" className={styles.contain} />
          </div>
          <ProductCaption name={dress.name} priceCents={dress.priceCents} />
        </Link>

        <Link href={productHref(earrings)} className={`${styles.item} ${styles.oval}`} data-reveal="rise" style={{ '--reveal-delay': '80ms' } as React.CSSProperties}>
          <div className={styles.ovalMedia}>
            <Image src={earrings.image} alt={earrings.name} fill sizes="22vw" className={styles.ovalImg} />
          </div>
          <ProductCaption name={earrings.name} priceCents={earrings.priceCents} />
        </Link>

        <Link href={productHref(framed)} className={`${styles.item} ${styles.framed}`} data-reveal="rise" style={{ '--reveal-delay': '160ms' } as React.CSSProperties}>
          <div className={styles.framedMedia} data-reveal="curtain" style={{ '--reveal-delay': '160ms' } as React.CSSProperties}>
            <Image src={framed.image} alt={framed.name} fill sizes="41vw" className={styles.cover} />
          </div>
          <ProductCaption name={framed.name} priceCents={framed.priceCents} />
        </Link>
      </div>

      <ul className={styles.grid}>
        {newArrivalsMobile.map((p) => (
          <li key={p.slug}>
            <Link href={productHref(p)} className={styles.gridItem}>
              <Image src={p.image} alt={p.name} fill sizes="50vw" className={styles.contain} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
