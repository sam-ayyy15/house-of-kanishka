import Image from 'next/image';
import { Eyebrow } from '../Eyebrow';
import styles from './WhoWeAre.module.css';

// The script is written letter by letter. Each letter gets its order in the sequence
// (spaces count as a short pause); the CSS turns that into a start time.
const SCRIPT_LINES = ['Looking', 'for our stories'];

function letters(text: string, start: number) {
  return [...text].map((ch, i) =>
    ch === ' ' ? (
      ' '
    ) : (
      <span key={i} className={styles.ch} style={{ '--k': start + i } as React.CSSProperties}>
        {ch}
      </span>
    ),
  );
}

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

      {/* data-reveal="cinema": on first view the photo zooms in, then the script is written
          (see WhoWeAre.module.css). Visible and still without JS or with reduced motion. */}
      <div className={styles.media} data-reveal="cinema">
        <div className={styles.photo}>
          {/* Placeholder (A03): local-only crop of the reference. Never ship. */}
          <Image src="/placeholders/who-we-are.jpg" alt="" fill sizes="(max-width: 767px) 80vw, 38vw" />
        </div>
        <p className={styles.script}>
          {/* Read once as a phrase; the per-letter spans are for the animation only. */}
          <span className="visually-hidden">{SCRIPT_LINES.join(' ')}</span>
          <span className={styles.l1} aria-hidden="true">
            {letters(SCRIPT_LINES[0], 0)}
          </span>
          <span className={styles.l2} aria-hidden="true">
            {letters(SCRIPT_LINES[1], SCRIPT_LINES[0].length + 1)}
          </span>
        </p>
      </div>
    </section>
  );
}
