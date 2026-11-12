'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Eyebrow } from '../Eyebrow';
import styles from './LoginView.module.css';

type Mode = 'signin' | 'create';

/**
 * Sign in / create account. EXTRAPOLATED – no reference design: an editorial split with a
 * portrait and the red script on one side (as in Who We Are) and one form at a time on the
 * other, switched with the same colour-only tabs as the product page.
 * Accounts are not connected: the forms validate, then say so.
 */
export function LoginView() {
  const [mode, setMode] = useState<Mode>('signin');
  const [submitted, setSubmitted] = useState(false);

  const choose = (m: Mode) => {
    setMode(m);
    setSubmitted(false);
  };

  return (
    <div className={styles.split}>
      <div className={styles.visual}>
        <div className={styles.photo}>
          {/* Placeholder: local-only photo. Never ship. */}
          <Image src="/placeholders/who-we-are.jpg" alt="" fill priority sizes="(max-width: 1023px) 0px, 50vw" />
        </div>
        <p className={styles.script} aria-hidden="true">
          <span>Welcome</span>
          <span className={styles.scriptLine2}>to the house</span>
        </p>
      </div>

      <div className={styles.panel}>
        <div className={styles.inner}>
          <Eyebrow>Account</Eyebrow>
          <h1 className={styles.title}>{mode === 'signin' ? 'Sign in' : 'Create an account'}</h1>

          <div className={styles.tabs} role="group" aria-label="Account options">
            <button type="button" className={styles.tab} aria-pressed={mode === 'signin'} onClick={() => choose('signin')}>
              Sign in
            </button>
            <button type="button" className={styles.tab} aria-pressed={mode === 'create'} onClick={() => choose('create')}>
              Create account
            </button>
          </div>

          <form
            key={mode}
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
          >
            {mode === 'create' && (
              <label className="field">
                <span>Name</span>
                <input name="name" autoComplete="name" required />
              </label>
            )}
            <label className="field">
              <span>Email</span>
              <input type="email" name="email" autoComplete="email" required />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                name={mode === 'signin' ? 'password' : 'new-password'}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                minLength={mode === 'create' ? 8 : undefined}
                required
              />
            </label>
            <button type="submit" className="btn btn-black">
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
            <p className={`status ${styles.status}`} role="status">
              {submitted &&
                'Accounts aren’t connected yet, so nothing was saved. Your bag and wishlist are kept in this browser.'}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
