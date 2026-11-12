'use client';

import { useState } from 'react';
import styles from './Simple.module.css';

/**
 * Sign in / create account. EXTRAPOLATED – no reference design.
 * Accounts are not connected: the forms validate, then say so.
 */
export function LoginView() {
  const [message, setMessage] = useState<'signin' | 'create' | null>(null);
  const note = 'Accounts aren’t connected yet, so nothing was saved. Your bag and wishlist are kept in this browser.';

  return (
    <>
      <h1 className="page-title">Login</h1>
      <div className={styles.auth}>
        <form
          className={styles.authForm}
          onSubmit={(e) => {
            e.preventDefault();
            setMessage('signin');
          }}
        >
          <h2 className={styles.authTitle}>Sign in</h2>
          <label className="field">
            <span>Email</span>
            <input type="email" name="email" autoComplete="email" required />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" name="password" autoComplete="current-password" required />
          </label>
          <button type="submit" className="btn btn-black">
            Sign in
          </button>
          <p className="status" role="status">
            {message === 'signin' && note}
          </p>
        </form>

        <form
          className={styles.authForm}
          onSubmit={(e) => {
            e.preventDefault();
            setMessage('create');
          }}
        >
          <h2 className={styles.authTitle}>Create an account</h2>
          <label className="field">
            <span>Name</span>
            <input name="name" autoComplete="name" required />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" name="email" autoComplete="email" required />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" name="new-password" autoComplete="new-password" minLength={8} required />
          </label>
          <button type="submit" className="btn btn-outline">
            Create account
          </button>
          <p className="status" role="status">
            {message === 'create' && note}
          </p>
        </form>
      </div>
    </>
  );
}
