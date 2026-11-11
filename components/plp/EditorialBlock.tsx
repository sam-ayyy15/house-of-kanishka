import Image from 'next/image';
import Link from 'next/link';
import { PDP_HREF, plpAccessories } from '@/lib/products';
import { ProductCaption } from '../ProductCaption';
import { UnderlineLink } from '../UnderlineLink';
import styles from './EditorialBlock.module.css';

const [bracelets, miniBag] = plpAccessories;

/**
 * PLP editorial interstitial (spec §5.1, S2): soft grey blob with a heading, two accessories,
 * two large lifestyle cut-outs and a faint script watermark. Placed in % of a 1440 × 960 box.
 */
export function EditorialBlock() {
  return (
    <section className={styles.block} aria-labelledby="plp-editorial-title">
      <svg className={styles.blob} viewBox="0 0 1440 960" preserveAspectRatio="none" aria-hidden="true">
        <ellipse cx="180" cy="520" rx="470" ry="500" />
        <ellipse cx="560" cy="520" rx="230" ry="470" />
      </svg>

      {/* Spec §5.1 reads it as "Halter collection" (partly legible, [E]). */}
      <p className={styles.watermark} aria-hidden="true">
        Halter
        <br />
        collection
      </p>

      <div className={styles.copy}>
        <h2 id="plp-editorial-title" className={styles.heading}>
          Add the perfect
          <br /> touch to your look
        </h2>
        <UnderlineLink href="#">View accessories</UnderlineLink>
      </div>

      <Link href={PDP_HREF} className={`${styles.product} ${styles.bracelets}`}>
        <div className={styles.productMedia} style={{ aspectRatio: 1 }}>
          <Image src={bracelets.image} alt="" fill sizes="(max-width: 767px) 45vw, 13vw" className={styles.blend} />
        </div>
        <ProductCaption name={bracelets.name} priceCents={bracelets.priceCents} align="center" className={styles.caption} />
      </Link>

      <Link href={PDP_HREF} className={`${styles.product} ${styles.miniBag}`}>
        <div className={styles.productMedia} style={{ aspectRatio: 130 / 124 }}>
          <Image src={miniBag.image} alt="" fill sizes="(max-width: 767px) 45vw, 20vw" className={styles.blend} />
        </div>
        <ProductCaption name={miniBag.name} priceCents={miniBag.priceCents} align="center" className={styles.caption} />
      </Link>

      <div className={`${styles.lifestyle} ${styles.front}`}>
        <Image src="/placeholders/plp-pink-front.jpg" alt="Pink floral satin cowl-neck midi dress, front" fill sizes="(max-width: 767px) 50vw, 17vw" />
      </div>
      <div className={`${styles.lifestyle} ${styles.back}`}>
        <Image src="/placeholders/plp-pink-back.jpg" alt="Pink floral satin cowl-neck midi dress, back" fill sizes="(max-width: 767px) 50vw, 17vw" />
      </div>
    </section>
  );
}
