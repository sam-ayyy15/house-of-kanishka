'use client';

import { useActionState, useState, useTransition } from 'react';
import { advanceOrder, cancelOrder, refundOrder, saveOrderNote, shipOrder, type AdminState } from '@/app/actions/admin';
import { Field, TextAreaField } from '../form/Field';
import { FormStatus } from '../form/FormStatus';
import { keepValues } from '../form/keep';
import { SubmitButton } from '../form/SubmitButton';
import styles from './Admin.module.css';

type Props = { number: string; status: string; paidOnline: boolean; note: string; hasAttention: boolean };

/** What the founder can do with an order next, depending on where it is. */
export function OrderActions({ number, status, paidOnline, note, hasAttention }: Props) {
  const [reply, setReply] = useState<AdminState>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<null | 'cancel' | 'refund'>(null);
  const [, start] = useTransition();
  const [shipState, shipAction, shipping] = useActionState<AdminState, FormData>(shipOrder, null);
  const [noteState, noteAction, savingNote] = useActionState<AdminState, FormData>(saveOrderNote, null);

  const run = (key: string, action: () => Promise<AdminState>) => {
    setBusy(key);
    start(async () => {
      setReply(await action());
      setBusy(null);
      setConfirming(null);
    });
  };
  const open = !['delivered', 'cancelled', 'expired', 'refunded'].includes(status);

  return (
    <div className={styles.actions}>
      <p className={styles.label}>Next step</p>

      {status === 'awaiting_confirmation' && (
        <SubmitButton type="button" pending={busy === 'confirm'} busyLabel="Confirming…" onClick={() => run('confirm', () => advanceOrder(number, 'confirmed'))}>
          Confirm for the customer
        </SubmitButton>
      )}
      {status === 'confirmed' && (
        <SubmitButton type="button" pending={busy === 'pack'} busyLabel="Saving…" onClick={() => run('pack', () => advanceOrder(number, 'packed'))}>
          Mark as packed
        </SubmitButton>
      )}
      {status === 'packed' && (
        <form onSubmit={keepValues(shipAction)}>
          <input type="hidden" name="number" value={number} />
          <Field label="Courier" name="courier" required maxLength={60} />
          <Field label="Tracking number (optional)" name="tracking_number" maxLength={60} />
          <Field label="Tracking link (optional)" name="tracking_url" type="url" inputMode="url" />
          <SubmitButton pending={shipping} busyLabel="Saving…">
            Mark as shipped
          </SubmitButton>
          <FormStatus message={shipState?.message} ok={shipState?.ok} />
        </form>
      )}
      {status === 'shipped' && (
        <SubmitButton type="button" pending={busy === 'deliver'} busyLabel="Saving…" onClick={() => run('deliver', () => advanceOrder(number, 'delivered'))}>
          Mark as delivered
        </SubmitButton>
      )}
      {status === 'pending_payment' && <p className={styles.muted}>Waiting for the customer’s payment. It lapses by itself after 15 minutes.</p>}
      {!open && status !== 'delivered' && <p className={styles.muted}>This order is closed.</p>}

      {(open || status === 'delivered') &&
        (confirming ? (
          <>
            <p>
              {confirming === 'cancel'
                ? paidOnline
                  ? 'Cancel this order and refund it through Razorpay? The stock goes back on sale. This cannot be undone.'
                  : 'Cancel this order? The stock goes back on sale. This cannot be undone.'
                : 'Refund this delivered order? This cannot be undone. Put the returned stock back in Stock yourself.'}
            </p>
            <SubmitButton
              type="button"
              className="btn btn-red"
              pending={busy === 'close'}
              busyLabel="Working…"
              onClick={() => run('close', () => (confirming === 'cancel' ? cancelOrder(number) : refundOrder(number)))}
            >
              {confirming === 'cancel' ? 'Yes, cancel the order' : 'Yes, refund the order'}
            </SubmitButton>
            <button type="button" className="text-link" onClick={() => setConfirming(null)}>
              Keep it as it is
            </button>
          </>
        ) : (
          <button type="button" className="text-link" style={{ alignSelf: 'flex-start' }} onClick={() => setConfirming(status === 'delivered' ? 'refund' : 'cancel')}>
            {status === 'delivered' ? 'Refund (returned order)' : 'Cancel order'}
          </button>
        ))}
      <FormStatus message={reply?.message} ok={reply?.ok} />

      <form onSubmit={keepValues(noteAction)}>
        <input type="hidden" name="number" value={number} />
        <TextAreaField label="Private note" name="note" defaultValue={note} maxLength={2000} />
        {hasAttention && (
          <label className="check">
            <input type="checkbox" name="clear_attention" />
            <span>The attention notice is dealt with</span>
          </label>
        )}
        <SubmitButton pending={savingNote} busyLabel="Saving…" className="btn btn-outline">
          Save note
        </SubmitButton>
        <FormStatus message={noteState?.message} ok={noteState?.ok} />
      </form>
    </div>
  );
}
