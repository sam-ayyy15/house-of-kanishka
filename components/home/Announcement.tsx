import Link from 'next/link';
import { Emblem } from '../Emblem';
import styles from './Announcement.module.css';

/** The news. `script` is set in the house script, `text` in the serif beside it. Copy is from the site itself. */
const NEWS = [
  { script: 'Free shipping', text: 'on all orders above €350', href: '/help#shipping' },
  { script: 'Easy returns', text: 'within 30 days, hassle-free', href: '/help#returns' },
  { script: 'Golden Hour Paris', text: 'the new collection', href: '/collections/golden-hour-paris' },
];

/** The house voice, on the second ribbon (decorative): lines from "Who we are". */
const HOUSE = [
  { script: 'Parisian elegance', text: 'and modern simplicity' },
  { script: 'Effortlessly', text: 'complementing your life and style' },
  { script: 'House of Kanishka', text: 'made to move with you' },
];

/** Three copies of the run, so a one-third slide lands exactly on the next copy: no seam, any screen width. */
const COPIES = [0, 1, 2];

function Run<T extends { script: string; text: string; href?: string }>({ items, copy, links }: { items: T[]; copy: number; links: boolean }) {
  // Only the first copy is read and tabbed to; the others are for the loop.
  const spare = copy > 0;
  return (
    <ul className={styles.group} aria-hidden={spare || !links || undefined}>
      {items.map((m) => {
        const inner = (
          <>
            <span className={styles.script}>{m.script}</span>
            <span className={styles.text}>{m.text}</span>
          </>
        );
        return (
          <li key={m.script} className={styles.item}>
            {links && m.href ? (
              <Link href={m.href} className={styles.link} tabIndex={spare ? -1 : undefined}>
                {inner}
              </Link>
            ) : (
              <span className={styles.link}>{inner}</span>
            )}
            <Emblem bloom="none" className={styles.sep} />
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Announcement band between the hero and New Arrivals. EXTRAPOLATED – no reference design.
 * No backdrop of its own: the ribbons start below the hero photo, on the white above New Arrivals.
 * Two ribbons cross at a shallow angle (the site's tilted giant type, in miniature): a white one
 * with the news in script and serif, and a burgundy one behind it with the house's own words.
 * Each has a stitched edge (a fine line just inside it), red on the white ribbon and white on the
 * burgundy one. They drift slowly in opposite directions, always, and unroll into place on first view.
 * - Slows to a stop while the pointer or keyboard focus is on it, so a headline can be clicked.
 * - Only moves while on screen; with reduced motion nothing moves and one message is shown.
 */
export function Announcement() {
  return (
    <section className={styles.band} aria-label="Announcements" data-loop>
      <div className={styles.ribbons} data-reveal="fade">
        <div className={`${styles.ribbon} ${styles.back}`} aria-hidden="true">
          <div className={styles.track}>
            {COPIES.map((c) => (
              <Run key={c} items={HOUSE} copy={c} links={false} />
            ))}
          </div>
        </div>

        <div className={`${styles.ribbon} ${styles.front}`}>
          <div className={styles.track}>
            {COPIES.map((c) => (
              <Run key={c} items={NEWS} copy={c} links />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
