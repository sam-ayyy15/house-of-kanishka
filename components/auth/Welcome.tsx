'use client';

import { Emblem } from '../Emblem';
import { Handwriting } from '../Handwriting';
import styles from './AuthView.module.css';

/** How long the welcome plays before the next page opens (a click skips it). */
export const WELCOME_MS = 3200;

/**
 * The moment after signing in: the lotus opens and "Welcome back" (or, for a new account,
 * "Welcome / to the house") is written in script. While it plays, the login portrait and its
 * own script fade away (AuthShell `welcoming`), so it is the only welcome on screen, centred
 * on the page. A click moves on at once.
 */
export function Welcome({ kind, onSkip }: { kind: 'back' | 'new'; onSkip: () => void }) {
  return (
    <div className={styles.welcome} role="status" onClick={onSkip}>
      <Emblem bloom="load" className={styles.welcomeEmblem} delay={300} />
      {kind === 'new' ? (
        <p className={`${styles.welcomeScript} ${styles.welcomeTwoLines}`} data-write="load" style={{ '--write-delay': '700ms' } as React.CSSProperties}>
          <span className="visually-hidden">Welcome to the house</span>
          <span aria-hidden="true">
            <Handwriting text="Welcome" decorative />
          </span>
          <span aria-hidden="true" className={styles.welcomeLine2}>
            <Handwriting text="to the house" from={8} decorative />
          </span>
        </p>
      ) : (
        <p className={styles.welcomeScript} data-write="load" style={{ '--write-delay': '700ms' } as React.CSSProperties}>
          <Handwriting text="Welcome back" />
        </p>
      )}
    </div>
  );
}
