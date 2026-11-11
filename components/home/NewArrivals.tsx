import Image from 'next/image';
import Link from 'next/link';
import { newArrivals, newArrivalsMobile, PDP_HREF } from '@/lib/products';
import { ProductCaption } from '../ProductCaption';
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
        <h2 id="new-arrivals-title" className={styles.title}>
          <span className={styles.our}>Our </span>New Arrivals
        </h2>
        <UnderlineLink href="/dresses">View all</UnderlineLink>
      </div>

      <div className={styles.row}>
        <Link href={PDP_HREF} className={`${styles.item} ${styles.cutout}`}>
          <div className={styles.cutoutMedia}>
            <Image src={dress.image} alt={dress.name} fill sizes="30vw" className={styles.contain} />
          </div>
          <ProductCaption name={dress.name} priceCents={dress.priceCents} />
        </Link>

        <Link href={PDP_HREF} className={`${styles.item} ${styles.oval}`}>
          <div className={styles.ovalMedia}>
            <Image src={earrings.image} alt={earrings.name} fill sizes="22vw" className={styles.ovalImg} />
          </div>
          <ProductCaption name={earrings.name} priceCents={earrings.priceCents} />
        </Link>

        <Link href={PDP_HREF} className={`${styles.item} ${styles.framed}`}>
          <div className={styles.framedMedia}>
            <Image src={framed.image} alt={framed.name} fill sizes="41vw" className={styles.cover} />
          </div>
          <ProductCaption name={framed.name} priceCents={framed.priceCents} />
        </Link>
      </div>

      <ul className={styles.grid}>
        {newArrivalsMobile.map((p) => (
          <li key={p.slug}>
            <Link href={PDP_HREF} className={styles.gridItem}>
              <Image src={p.image} alt={p.name} fill sizes="50vw" className={styles.contain} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
