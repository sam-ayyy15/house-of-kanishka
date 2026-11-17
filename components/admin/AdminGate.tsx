'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { unlockAdmin, type UnlockState } from '@/app/actions/admin-gate';
import { Emblem } from '../Emblem';
import { Eyebrow } from '../Eyebrow';
import { Field } from '../form/Field';
import { SubmitButton } from '../form/SubmitButton';
import { Handwriting } from '../Handwriting';
import { RiseWords } from '../RiseWords';
import { ADMIN_DOORS_KEY, AdminDoors } from './AdminDoors';
import styles from './AdminGate.module.css';

const t = (ms: number) => ({ '--t': `${ms}ms` }) as React.CSSProperties;

/**
 * The admin password. EXTRAPOLATED – no reference design; built from the site's own
 * devices: the soft blob and script watermark (Help), the lotus, a word-by-word serif title,
 * a handwritten flourish, the red hairline and the floating-label field.
 *
 * Entrance: two brand-red doors with a white lotus on the seam part to the sides, then the
 * lotus blooms and the room settles in, line by line. On the right password the doors close
 * again, "Come in" is written across them, and they open onto the admin area (AdminDoors).
 * A wrong password gets a calm red line under the field: no shaking.
 */
export function AdminGate({ next, configured }: { next: string; configured: boolean }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<UnlockState, FormData>(unlockAdmin, null);
  const [show, setShow] = useState(false);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    if (!state?.ok) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setEntering(true);
    try {
      // The admin area opens its own pair of doors when it arrives.
      if (!reduce) window.sessionStorage.setItem(ADMIN_DOORS_KEY, '1');
    } catch {
      // Storage blocked: the admin area simply appears.
    }
    const id = window.setTimeout(() => {
      router.replace(next);
      router.refresh();
    }, reduce ? 0 : 1700);
    return () => window.clearTimeout(id);
  }, [state, next, router]);

  const error = state && !state.ok ? state.message : undefined;

  return (
    <div className={styles.stage} data-entering={entering ? '' : undefined}>
      {/* The soft blob and the founder's name as a faint script watermark, drifting slowly. */}
      <svg className={styles.blob} viewBox="0 0 1000 900" preserveAspectRatio="none" aria-hidden="true">
        <ellipse cx="380" cy="430" rx="330" ry="390" />
        <ellipse cx="660" cy="480" rx="250" ry="320" />
      </svg>
      <p className={styles.watermark} aria-hidden="true">
        Kanishka
      </p>

      <div className={styles.column}>
        <Emblem bloom="load" delay={900} className={styles.lotus} />
        <div style={t(1000)} className={styles.rise}>
          <Eyebrow>Admin</Eyebrow>
        </div>
        <h1 className={`page-title ${styles.title}`} data-rise="load" style={{ '--rise-delay': '1100ms' } as React.CSSProperties}>
          <RiseWords text="The founder’s" />{' '}
          <em>
            <RiseWords text="room" from={2} />
          </em>
        </h1>
        <p className={styles.script} data-write="load" style={{ '--write-delay': '1500ms' } as React.CSSProperties}>
          <Handwriting text="only for you" />
        </p>
        <span className={styles.hairline} style={t(2300)} aria-hidden="true" />

        <form action={action} className={`${styles.form} ${styles.rise}`} style={t(1700)}>
          {configured ? (
            <>
              <div className={styles.fieldRow}>
                <Field label="Password" name="password" type={show ? 'text' : 'password'} autoComplete="current-password" required error={error} />
                <button type="button" className={`text-link ${styles.reveal}`} onClick={() => setShow((s) => !s)} aria-pressed={show}>
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
              <SubmitButton pending={pending || entering} busyLabel="Checking the password" className={`btn btn-black ${styles.enter}`}>
                Enter
              </SubmitButton>
            </>
          ) : (
            <p className={styles.unset} role="status">
              The admin password has not been set up yet (ADMIN_PASSWORD_HASH).
            </p>
          )}
        </form>
        <p className={`${styles.note} ${styles.rise}`} style={t(1900)}>
          Stays open for 8 hours on this device. Lock it again any time from the admin menu.
        </p>
      </div>

      <AdminDoors mode={entering ? 'close' : 'open'} />
    </div>
  );
}
