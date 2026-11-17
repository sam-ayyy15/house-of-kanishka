'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { Emblem } from '../Emblem';
import { Handwriting } from '../Handwriting';
import styles from './AdminGate.module.css';

/** Set by the password page just before the admin area opens: play the doors once there. */
export const ADMIN_DOORS_KEY = 'hok-admin-doors';

const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Two brand-red doors with a white lotus on the seam (the admin area's entrance):
 * - "open":  closed at first, then they part to the sides (the password page, on arrival);
 * - "close": they swing shut and "Come in" is written across them (right password);
 * - "arrive": in the admin area, once after unlocking, they part to reveal it.
 * At rest they are open (off to the sides), so with reduced motion nothing ever covers the page.
 */
export function AdminDoors({ mode }: { mode: 'open' | 'close' | 'arrive' }) {
  const [arrive, setArrive] = useState(false);

  // In the admin area: only right after the password page, and only once.
  useBrowserLayoutEffect(() => {
    if (mode !== 'arrive') return;
    try {
      if (window.sessionStorage.getItem(ADMIN_DOORS_KEY)) {
        window.sessionStorage.removeItem(ADMIN_DOORS_KEY);
        setArrive(true);
      }
    } catch {
      // Storage blocked: no doors.
    }
  }, [mode]);

  if (mode === 'arrive' && !arrive) return null;
  return (
    <div className={styles.doors} data-mode={mode === 'arrive' ? 'open' : mode} aria-hidden="true">
      <span className={`${styles.door} ${styles.doorLeft}`} />
      <span className={`${styles.door} ${styles.doorRight}`} />
      <Emblem bloom="none" className={styles.doorLotus} />
      {mode === 'close' && (
        <p className={styles.comeIn} data-write="load" style={{ '--write-delay': '650ms' } as React.CSSProperties}>
          <Handwriting text="Come in" decorative />
        </p>
      )}
    </div>
  );
}
