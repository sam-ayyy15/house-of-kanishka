'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { confirmCodHere, resendCodEmail } from '@/app/actions/checkout';
import { FormStatus } from '../form/FormStatus';
import { SubmitButton } from '../form/SubmitButton';
import styles from './Order.module.css';

/**
 * Under the greeting of a cash-on-delivery order that still needs confirming: send the
 * email again, or (only if no email could be sent) confirm on the page.
 */
export function CodConfirm({ number, token, emailSent }: { number: string; token: string; emailSent: boolean }) {
  const router = useRouter();
  const [sent, setSent] = useState(emailSent);
  const [note, setNote] = useState<{ ok: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState<null | 'send' | 'confirm'>(null);
  const [, start] = useTransition();

  const run = (kind: 'send' | 'confirm') => {
    setBusy(kind);
    start(async () => {
      const reply = kind === 'send' ? await resendCodEmail(number, token) : await confirmCodHere(number, token);
      setNote(reply);
      setBusy(null);
      if (kind === 'send' && reply.ok) setSent(true);
      if (kind === 'confirm' && reply.ok) router.refresh();
    });
  };

  return (
    // Clicks here are for the buttons, not for skipping the bill's entrance.
    <div className={styles.codConfirm} onClick={(e) => e.stopPropagation()}>
      <div className={styles.codActions}>
        {!sent && (
          <SubmitButton type="button" pending={busy === 'confirm'} busyLabel="Confirming…" className="btn btn-red" onClick={() => run('confirm')}>
            Confirm my order here
          </SubmitButton>
        )}
        <SubmitButton type="button" pending={busy === 'send'} busyLabel="Sending…" className="btn btn-outline" onClick={() => run('send')}>
          {sent ? 'Send the email again' : 'Try the email again'}
        </SubmitButton>
      </div>
      <FormStatus message={note?.message} ok={note?.ok} />
    </div>
  );
}
