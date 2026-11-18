'use client';

import { useActionState, useState } from 'react';
import { joinWaitlist, type FormResult } from '@/app/actions/waitlist';
import { Emblem } from '../Emblem';
import { Turnstile } from '../form/Turnstile';
import { Handwriting } from '../Handwriting';
import form from '../home/Newsletter.module.css';
import styles from './ComingSoon.module.css';

/**
 * "Notify me" for a category that has not launched: the newsletter's email field (with the
 * house lotus at its end) and a black button. On success the lotus blooms and a line of
 * script is written, as in the newsletter thank-you.
 */
export function NotifyForm({ category }: { category: string }) {
  const [result, action, pending] = useActionState<FormResult | null, FormData>(joinWaitlist, null);
  const [check, setCheck] = useState<string | null>(null);

  if (result?.ok) {
    return (
      <div className={styles.thanks} role="status">
        <Emblem bloom="load" className={styles.thanksEmblem} />
        <p className={styles.thanksScript} data-write="load" style={{ '--write-delay': '500ms' } as React.CSSProperties}>
          <Handwriting text="Thank you" />
        </p>
        <p className={styles.thanksText}>We’ll write to you the day they arrive.</p>
      </div>
    );
  }

  return (
    <div className={styles.notify}>
      <form className={form.form} action={action}>
        <input type="hidden" name="category" value={category} />
        <input type="hidden" name="cf-turnstile-response" value={check ?? ''} />
        <label htmlFor={`notify-${category}`} className="visually-hidden">
          Email address
        </label>
        <div className={form.field}>
          <input
            id={`notify-${category}`}
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="Enter your email address"
            className={form.input}
          />
          <Emblem className={form.fieldEmblem} />
        </div>
        <button type="submit" className={form.button} disabled={pending} aria-busy={pending}>
          {pending ? 'Sending…' : 'Notify me'}
        </button>
      </form>
      <Turnstile action="notify" onToken={setCheck} resetKey={result} className={form.turnstile} />
      <p className={`status ${styles.error}`} role="status">
        {result && !result.ok && result.message}
      </p>
    </div>
  );
}
