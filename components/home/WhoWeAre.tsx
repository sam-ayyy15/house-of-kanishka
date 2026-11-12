import Image from 'next/image';
import { Eyebrow } from '../Eyebrow';
import styles from './WhoWeAre.module.css';

/** Homepage §4.4. Photo straight, no tilt (approved, Q4). */
export function WhoWeAre() {
  return (
    <section className={styles.section} aria-labelledby="who-we-are-title">
      <Eyebrow className={styles.eyebrow}>
        <span id="who-we-are-title">Who we are</span>
      </Eyebrow>
      <p className={styles.statement} data-reveal="rise">
        Inspired by Parisian elegance and modern simplicity,
        <br className={styles.br} /> we create pieces that move with you, <em>effortlessly</em>
        <br className={styles.br} /> <em>complementing your life and style</em>
      </p>

      <div className={styles.media} data-loop>
        {/* Displacement map for the satin ripple: slow, low-frequency noise that drifts. */}
        <svg width="0" height="0" className={styles.defs} aria-hidden="true" focusable="false">
          <filter id="vr-satin" x="-4%" y="-4%" width="108%" height="108%">
            <feTurbulence type="fractalNoise" baseFrequency="0.007 0.013" numOctaves="2" seed="4">
              <animate
                attributeName="baseFrequency"
                dur="11s"
                values="0.007 0.013;0.011 0.008;0.007 0.013"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" scale="10" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
        <div className={styles.photo}>
          {/* Placeholder (A03): local-only crop of the reference. Never ship. */}
          <Image src="/placeholders/who-we-are.jpg" alt="" fill sizes="(max-width: 767px) 80vw, 38vw" />
          {/* Satin in motion: a rippling copy of the photo, masked to the dress so the face
              stays still, plus a soft band of light that crosses the fabric. */}
          <Image
            src="/placeholders/who-we-are.jpg"
            alt=""
            aria-hidden="true"
            fill
            sizes="(max-width: 767px) 80vw, 38vw"
            className={styles.ripple}
          />
          <span className={styles.sheen} aria-hidden="true" />
        </div>
        <p className={styles.script}>
          <span className={styles.l1}>Looking</span>
          <span className={styles.l2}>for our stories</span>
        </p>
      </div>
    </section>
  );
}
