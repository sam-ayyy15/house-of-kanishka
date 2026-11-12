'use client';

import { useClerk, useSession, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Eyebrow } from '../Eyebrow';
import styles from './AccountView.module.css';

type Device = {
  id: string;
  lastActiveAt: Date;
  latestActivity: { browserName?: string; deviceType?: string; city?: string; country?: string; isMobile?: boolean };
  revoke: () => Promise<unknown>;
};

const message = (e: unknown) => {
  const err = e as { errors?: { longMessage?: string; message?: string }[]; message?: string };
  return err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? err?.message ?? 'Something went wrong. Please try again.';
};

const when = (d: Date) =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d);

/**
 * Account management: profile, email, password, connected sign-in methods, signed-in
 * devices, sign out and delete. EXTRAPOLATED – no reference design: rows of serif titles and
 * answers, as on the Help page.
 */
export function AccountView() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { session } = useSession();
  const { signOut } = useClerk();

  const [note, setNote] = useState<Record<string, { ok: boolean; text: string }>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const loadDevices = useCallback(async () => {
    if (!user) return;
    try {
      setDevices((await user.getSessions()) as unknown as Device[]);
    } catch {
      setDevices([]);
    }
  }, [user]);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  if (!isLoaded) return <p role="status">Loading your account…</p>;
  if (!user) return null; // the proxy redirects signed-out visitors to /login

  /** Runs one account change and reports the result next to the control that caused it. */
  async function act(key: string, action: () => Promise<unknown>, done: string) {
    setBusy(key);
    setNote((n) => ({ ...n, [key]: { ok: true, text: '' } }));
    try {
      await action();
      setNote((n) => ({ ...n, [key]: { ok: true, text: done } }));
    } catch (e) {
      setNote((n) => ({ ...n, [key]: { ok: false, text: message(e) } }));
    } finally {
      setBusy(null);
    }
  }

  const status = (key: string) => (
    <p className={`status ${note[key]?.ok === false ? styles.error : ''}`} role="status">
      {note[key]?.text}
    </p>
  );

  const email = user.primaryEmailAddress;
  const verified = email?.verification?.status === 'verified';
  const google = user.externalAccounts.find((a) => a.provider === 'google');

  return (
    <>
      <header className={styles.head}>
        <Eyebrow>Account</Eyebrow>
        <h1 className="page-title">
          Hello{user.firstName ? ', ' : ''}
          {user.firstName && <em>{user.firstName}</em>}
        </h1>
        <nav className={styles.shortcuts} aria-label="Your lists">
          <Link href="/wishlist" className="text-link">
            Wishlist
          </Link>
          <Link href="/bag" className="text-link">
            Shopping bag
          </Link>
        </nav>
      </header>

      <section className={styles.row} aria-labelledby="acc-profile">
        <h2 id="acc-profile" className={styles.rowTitle}>
          <span className={styles.index}>(01)</span>Profile
        </h2>
        <form
          className={styles.body}
          onSubmit={(e) => {
            e.preventDefault();
            const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
            act('profile', () => user.update({ firstName: f.firstName, lastName: f.lastName }), 'Saved.');
          }}
        >
          <div className={styles.two}>
            <label className="field">
              <span>First name</span>
              <input name="firstName" autoComplete="given-name" defaultValue={user.firstName ?? ''} required />
            </label>
            <label className="field">
              <span>Last name</span>
              <input name="lastName" autoComplete="family-name" defaultValue={user.lastName ?? ''} />
            </label>
          </div>
          <button type="submit" className="btn btn-black" disabled={busy === 'profile'}>
            {busy === 'profile' ? 'Saving…' : 'Save'}
          </button>
          {status('profile')}
        </form>
      </section>

      <section className={styles.row} aria-labelledby="acc-email">
        <h2 id="acc-email" className={styles.rowTitle}>
          <span className={styles.index}>(02)</span>Email &amp; sign-in
        </h2>
        <div className={styles.body}>
          <dl className={styles.facts}>
            <div>
              <dt>Email</dt>
              <dd>
                {email?.emailAddress ?? '—'} <span className={styles.tag}>{verified ? 'Verified' : 'Not verified'}</span>
              </dd>
            </div>
            <div>
              <dt>Google</dt>
              <dd>{google ? `Connected${google.emailAddress ? ` · ${google.emailAddress}` : ''}` : 'Not connected'}</dd>
            </div>
            <div>
              <dt>Password</dt>
              <dd>{user.passwordEnabled ? 'Set' : 'Not set (you sign in with Google)'}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className={styles.row} aria-labelledby="acc-password">
        <h2 id="acc-password" className={styles.rowTitle}>
          <span className={styles.index}>(03)</span>Password
        </h2>
        <form
          className={styles.body}
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const f = Object.fromEntries(new FormData(form)) as Record<string, string>;
            act(
              'password',
              async () => {
                await user.updatePassword({
                  currentPassword: user.passwordEnabled ? f.current : undefined,
                  newPassword: f.next,
                  signOutOfOtherSessions: true,
                });
                form.reset();
                await loadDevices();
              },
              'Password updated. Other devices were signed out.',
            );
          }}
        >
          {user.passwordEnabled && (
            <label className="field">
              <span>Current password</span>
              <input type="password" name="current" autoComplete="current-password" required />
            </label>
          )}
          <label className="field">
            <span>New password</span>
            <input type="password" name="next" autoComplete="new-password" minLength={8} required />
          </label>
          <button type="submit" className="btn btn-black" disabled={busy === 'password'}>
            {busy === 'password' ? 'Saving…' : user.passwordEnabled ? 'Change password' : 'Set a password'}
          </button>
          {status('password')}
        </form>
      </section>

      <section className={styles.row} aria-labelledby="acc-devices">
        <h2 id="acc-devices" className={styles.rowTitle}>
          <span className={styles.index}>(04)</span>Signed-in devices
        </h2>
        <div className={styles.body}>
          {devices === null ? (
            <p className="muted">Loading…</p>
          ) : (
            <ul className={styles.devices}>
              {devices.map((d) => {
                const a = d.latestActivity ?? {};
                const current = d.id === session?.id;
                return (
                  <li key={d.id}>
                    <div>
                      <p className={styles.device}>
                        {[a.browserName, a.deviceType ?? (a.isMobile ? 'Mobile' : null)].filter(Boolean).join(' · ') || 'Unknown device'}
                        {current && <span className={styles.tag}>This device</span>}
                      </p>
                      <p className="muted">
                        {[a.city, a.country].filter(Boolean).join(', ') || 'Location unknown'} · Last active {when(new Date(d.lastActiveAt))}
                      </p>
                    </div>
                    {!current && (
                      <button
                        type="button"
                        className="text-link"
                        disabled={busy === d.id}
                        onClick={() => act('devices', async () => { await d.revoke(); await loadDevices(); }, 'That device was signed out.')}
                      >
                        Sign out
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {status('devices')}
        </div>
      </section>

      <section className={styles.row} aria-labelledby="acc-leave">
        <h2 id="acc-leave" className={styles.rowTitle}>
          <span className={styles.index}>(05)</span>Sign out
        </h2>
        <div className={styles.body}>
          <button type="button" className="btn btn-outline" onClick={() => signOut({ redirectUrl: '/' })}>
            Sign out
          </button>

          <div className={styles.danger}>
            {!confirmDelete ? (
              <button type="button" className="text-link" onClick={() => setConfirmDelete(true)}>
                Delete my account
              </button>
            ) : (
              <>
                <p>This permanently deletes your account and sign-in. It can’t be undone.</p>
                <div className={styles.dangerActions}>
                  <button
                    type="button"
                    className="btn btn-red"
                    disabled={busy === 'delete'}
                    onClick={() => act('delete', async () => { await user.delete(); router.push('/'); }, '')}
                  >
                    {busy === 'delete' ? 'Deleting…' : 'Delete account'}
                  </button>
                  <button type="button" className="text-link" onClick={() => setConfirmDelete(false)}>
                    Keep my account
                  </button>
                </div>
                {status('delete')}
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
