'use client';

import { Emblem } from '../Emblem';
import { Handwriting } from '../Handwriting';
import styles from './AuthView.module.css';

/** How long the welcome plays before the next page opens (a click skips it). */
export const WELCOME_MS = 3200;

/**
 * The moment after signing in: the lotus opens and "Welcome back" (or "Welcome", for a new
 * account) is written in script. Sits over the login panel; a click moves on at once.
 */
export function Welcome({ kind, onSkip }: { kind: 'back' | 'new'; onSkip: () => void }) {
  return (
    <div className={styles.welcome} role="status" onClick={onSkip}>
      <Emblem bloom="load" className={styles.welcomeEmblem} delay={300} />
      <p className={styles.welcomeScript} data-write="load" style={{ '--write-delay': '700ms' } as React.CSSProperties}>
        <Handwriting text={kind === 'new' ? 'Welcome' : 'Welcome back'} />
      </p>
    </div>
  );
}
