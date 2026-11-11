'use client';

import styles from './Newsletter.module.css';

/**
 * Email input + black SUBSCRIBE button (spec §3.3, §3.4).
 * Not wired yet: the email provider, success, error and consent states are all [M].
 */
export function NewsletterForm() {
  return (
    <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
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
