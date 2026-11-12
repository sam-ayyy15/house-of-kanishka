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
        <div className={styles.photo}>
          {/* Placeholder (A03): local-only crop of the reference. Never ship. */}
          <Image src="/placeholders/who-we-are.jpg" alt="" fill sizes="(max-width: 767px) 80vw, 38vw" />
        </div>
        <p className={styles.script}>
          <span className={styles.l1}>Looking</span>
          <span className={styles.l2}>for our stories</span>
        </p>
      </div>
    </section>
  );
}
