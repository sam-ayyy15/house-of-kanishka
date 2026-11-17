import Image from 'next/image';
import Link from 'next/link';
import { getCatalog } from '@/lib/catalog';
import { productHref, type Product } from '@/lib/products';
import { ProductCaption } from '../ProductCaption';
import { UnderlineLink } from '../UnderlineLink';
import styles from './EditorialBlock.module.css';


/**
 * PLP editorial interstitial (spec §5.1, S2): soft grey blob with a heading, two accessories,
 * two large lifestyle cut-outs and a faint script watermark. Placed in % of a 1440 × 960 box.
 */
export async function EditorialBlock() {
  const catalog = await getCatalog();
  // The two accessories may be on sale, or still "coming soon" (shown, but not linked or priced).
  const [bracelets, miniBag] = (catalog.lists['plp.accessories'] ?? [])
    .map((slug) => [...catalog.products, ...catalog.teasers].find((p) => p.slug === slug))
    .filter((p): p is Product => !!p);
  const soon = (p: Product) => catalog.comingSoon.includes(p.category);
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
        <UnderlineLink href="/accessories">View accessories</UnderlineLink>
      </div>

      {bracelets &&
        (soon(bracelets) ? (
          <div className={`${styles.product} ${styles.bracelets}`}>
            <div className={styles.productMedia} style={{ aspectRatio: 1 }}>
              <Image src={bracelets.image} alt="" fill sizes="(max-width: 767px) 45vw, 13vw" className={styles.blend} />
            </div>
            <ProductCaption name={bracelets.name} price={bracelets.price} note="Coming soon" align="center" className={styles.caption} />
          </div>
        ) : (
          <Link href={productHref(bracelets)} className={`${styles.product} ${styles.bracelets}`}>
            <div className={styles.productMedia} style={{ aspectRatio: 1 }}>
              <Image src={bracelets.image} alt="" fill sizes="(max-width: 767px) 45vw, 13vw" className={styles.blend} />
            </div>
            <ProductCaption name={bracelets.name} price={bracelets.price} align="center" className={styles.caption} />
          </Link>
        ))}

      {miniBag &&
        (soon(miniBag) ? (
          <div className={`${styles.product} ${styles.miniBag}`}>
            <div className={styles.productMedia} style={{ aspectRatio: 130 / 124 }}>
              <Image src={miniBag.image} alt="" fill sizes="(max-width: 767px) 45vw, 20vw" className={styles.blend} />
            </div>
            <ProductCaption name={miniBag.name} price={miniBag.price} note="Coming soon" align="center" className={styles.caption} />
          </div>
        ) : (
          <Link href={productHref(miniBag)} className={`${styles.product} ${styles.miniBag}`}>
            <div className={styles.productMedia} style={{ aspectRatio: 130 / 124 }}>
              <Image src={miniBag.image} alt="" fill sizes="(max-width: 767px) 45vw, 20vw" className={styles.blend} />
            </div>
            <ProductCaption name={miniBag.name} price={miniBag.price} align="center" className={styles.caption} />
          </Link>
        ))}

      <Link href="/products/floral-satin-midi-dress" className={`${styles.lifestyle} ${styles.front}`}>
        <Image src="/placeholders/plp-pink-front.jpg" alt="Pink floral satin cowl-neck midi dress, front" fill sizes="(max-width: 767px) 50vw, 17vw" />
      </Link>
      <Link href="/products/floral-satin-midi-dress" className={`${styles.lifestyle} ${styles.back}`} tabIndex={-1} aria-hidden="true">
        <Image src="/placeholders/plp-pink-back.jpg" alt="Pink floral satin cowl-neck midi dress, back" fill sizes="(max-width: 767px) 50vw, 17vw" />
      </Link>
    </section>
  );
}
