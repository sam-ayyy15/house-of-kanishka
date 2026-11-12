import Image from 'next/image';
import { OverlayLabel } from '../OverlayLabel';
import styles from './NewCollection.module.css';

/**
 * Homepage §4.5: giant tilted "NEW COLLECTION" on brand red, passing behind a
 * double-ellipse photo mask. The model is fully clipped by the ovals (no pop-out).
 */
export function NewCollection({ asHero = false }: { asHero?: boolean }) {
  return (
    <section className={styles.section} aria-label="New collection: Golden Hour Paris" data-loop>
      {/* Mask shapes, in the photo box's own units (spec §12.4 #2). */}
      <svg width="0" height="0" className={styles.defs} aria-hidden="true" focusable="false">
        {/* Tuned against V 7.2 s and S3: the ovals overlap by ~35 %, leaving a visible notch
            top and bottom. The same shapes on a taller box give the mobile notched form. */}
        <clipPath id="vr-ovals" clipPathUnits="objectBoundingBox">
          <ellipse cx="0.32" cy="0.5" rx="0.32" ry="0.5" />
          <ellipse cx="0.68" cy="0.5" rx="0.32" ry="0.5" />
        </clipPath>
      </svg>

      <p className={styles.giant} aria-hidden="true">
        <span className={styles.giantLine1}>New C</span>
        <span className={styles.giantLine2}>ollection</span>
      </p>

      <div className={styles.mask}>
        {/* Placeholder (A04): local-only crop of the reference. Never ship. */}
        <Image src="/placeholders/new-collection.jpg" alt="" fill sizes="(max-width: 767px) 88vw, 48vw" />
      </div>

      <OverlayLabel
        href="/collections/golden-hour-paris"
        eyebrow="New Collection"
        lines={['Golden', 'Hour Paris']}
        className={`${styles.label} ${styles.tl} ${asHero ? styles.tlHero : ''}`}
        titleClassName={styles.tlTitle}
      />
      <OverlayLabel href="/collections/season-of-grace" eyebrow="New Collection" lines={['Season', 'Of Grace']} className={`${styles.label} ${styles.br}`} />
    </section>
  );
}
