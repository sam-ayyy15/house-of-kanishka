'use client';

import { useActionState } from 'react';
import { subscribeNewsletter, type FormState } from '@/app/actions/forms';
import { Emblem } from '../Emblem';
import styles from './Newsletter.module.css';

/**
 * Email input (with the house lotus at its end) + black SUBSCRIBE button (spec §3.3, §3.4).
 * The address is saved on the server and confirmed by email (double opt-in).
 */
export function NewsletterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribeNewsletter, null);

  if (state?.ok) {
    return (
      <p className={styles.thanks} role="status">
        <Emblem bloom="load" className={styles.thanksEmblem} />
        {state.message}
      </p>
    );
  }

  return (
    <>
      <form className={styles.form} action={action}>
        <label htmlFor="newsletter-email" className="visually-hidden">
          Email address
        </label>
        {/* Left empty by people; see isBot() in app/actions/forms.ts. */}
        <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="visually-hidden" />
        {/* The lotus sits at the end of the field: it opens as the form appears, darkens while
            the field is in use and turns brand red once the address looks complete. */}
        <div className={styles.field}>
          <input
            id="newsletter-email"
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="Enter your email address"
            className={styles.input}
          />
          <Emblem className={styles.fieldEmblem} />
        </div>
        <button type="submit" className={styles.button} disabled={pending} aria-busy={pending}>
          {pending ? 'Sending…' : 'Subscribe'}
        </button>
      </form>
      {state && !state.ok && (
        <p className={`status ${styles.formError}`} role="status">
          {state.message}
        </p>
      )}
    </>
  );
}
