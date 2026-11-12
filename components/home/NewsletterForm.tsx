'use client';

import { useState } from 'react';
import styles from './Newsletter.module.css';

/**
 * Email input + black SUBSCRIBE button (spec §3.3, §3.4).
 * Not connected to an email provider yet: it validates, then confirms in place.
 */
export function NewsletterForm() {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p className={styles.thanks} role="status">
        Thank you. Sign-ups open soon, so your address hasn’t been stored yet.
      </p>
    );
  }

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        setDone(true);
      }}
    >
      <label htmlFor="newsletter-email" className="visually-hidden">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        name="email"
        required
        autoComplete="email"
        placeholder="Enter your email address"
        className={styles.input}
      />
      <button type="submit" className={styles.button}>
        Subscribe
      </button>
    </form>
  );
}
