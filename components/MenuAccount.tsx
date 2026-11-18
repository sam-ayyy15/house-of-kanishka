'use client';

import { useClerk, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { WhenSignedIn } from './auth/AuthEnabled';
import { Handwriting } from './Handwriting';
import styles from './MenuDrawer.module.css';

type Props = { open: boolean; onNavigate: () => void };

const NAME_WRITTEN = 'hok-menu-name-written';

/** Signed out: the two ways in, as plain house buttons. */
function SignedOut({ onNavigate }: Pick<Props, 'onNavigate'>) {
  return (
    <div className={styles.account}>
      <p className={styles.accountLabel}>Your account</p>
      <div className={styles.accountButtons}>
        <Link href="/login" onClick={onNavigate} className="btn btn-black">
          Sign in
        </Link>
        <Link href="/login?tab=create" onClick={onNavigate} className="btn btn-outline">
          Create account
        </Link>
      </div>
    </div>
  );
}

/**
 * Signed in: the first name in the house script (as on the desktop header and "Welcome
 * back"), written in the first time the menu opens in a visit, with the account links under it.
 */
function SignedIn({ open, onNavigate }: Props) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const name = user?.firstName?.trim() || user?.fullName?.trim().split(/\s+/)[0] || '';
  const [write, setWrite] = useState(false);

  useEffect(() => {
    if (!open || !name) return;
    try {
      if (window.sessionStorage.getItem(NAME_WRITTEN)) return;
      window.sessionStorage.setItem(NAME_WRITTEN, '1');
    } catch {
      return; // Storage blocked: the name is simply shown.
    }
    setWrite(true);
    // Once written, let it rest, so reopening the menu doesn't write it again.
    const id = window.setTimeout(() => setWrite(false), 2600);
    return () => window.clearTimeout(id);
  }, [open, name]);

  return (
    <div className={styles.account}>
      {name ? (
        <Link
          href="/account"
          onClick={onNavigate}
          className={styles.accountName}
          aria-label={`Your account, ${name}`}
          data-write={write ? 'load' : undefined}
          style={{ '--write-delay': '350ms' } as React.CSSProperties}
        >
          <Handwriting text={name} decorative />
        </Link>
      ) : (
        <p className={styles.accountLabel}>Your account</p>
      )}
      <div className={styles.accountLinks}>
        <Link href="/account" onClick={onNavigate} className={styles.utilityLink}>
          My account
        </Link>
        <Link href="/account/orders" onClick={onNavigate} className={styles.utilityLink}>
          Orders
        </Link>
        <button
          type="button"
          className={styles.utilityLink}
          onClick={() => {
            onNavigate();
            void signOut({ redirectUrl: '/' });
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

/**
 * The account bar at the top of the menu (phones and tablets have no account link in the
 * header): signed out, "Sign in" / "Create account"; signed in, the name in script.
 */
export function MenuAccount(props: Props) {
  return <WhenSignedIn signedIn={<SignedIn {...props} />} signedOut={<SignedOut onNavigate={props.onNavigate} />} />;
}
