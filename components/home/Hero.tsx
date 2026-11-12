import Image from 'next/image';
import { Handwriting } from '../Handwriting';
import { UnderlineLink } from '../UnderlineLink';
import styles from './Hero.module.css';

/** Homepage §4.1 "there she rose". Static: no motion is evidenced. */
export function Hero() {
  return (
    <section id="hero" className={styles.hero} aria-label="Introduction">
      {/* Placeholder (A01): local-only crop of the reference. Never ship. */}
      <Image
        src="/placeholders/hero.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className={styles.photo}
      />

      <h1 className={styles.lockup}>
        <span className={styles.line1}>there she</span>
        <span className={styles.rose}>rose</span>
        {/* The signature is written out once the lockup has landed. */}
        <span className={styles.script} data-write="load">
          <Handwriting text="jamilie sea" />
        </span>
      </h1>

      <UnderlineLink href="/collections/golden-hour-paris" className={styles.cta}>
        Discover the collection
      </UnderlineLink>
    </section>
  );
}
