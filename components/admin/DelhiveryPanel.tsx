'use client';

import { useActionState, useState, useTransition } from 'react';
import type { AdminState } from '@/app/actions/admin';
import { cancelDelhiveryBooking, handedToDelhivery, refreshTracking, shipWithDelhivery } from '@/app/actions/delhivery';
import { Field } from '../form/Field';
import { FormStatus } from '../form/FormStatus';
import { keepValues } from '../form/keep';
import { SubmitButton } from '../form/SubmitButton';
import styles from './Admin.module.css';

export type DelhiveryInfo = {
  /** Booking possible (token, address and pickup location are set). */
  configured: boolean;
  /** This order's parcel is booked with Delhivery. */
  booked: boolean;
  waybill: string | null;
  /** The usual parcel weight in grams (Settings), pre-filled. */
  weightG: number;
  /** Worth ₹50,000 or more: Delhivery needs the e-waybill number. */
  needsEwaybill: boolean;
  /** Delhivery's latest word, already in plain words and India time. */
  latest: { words: string; where: string | null; when: string | null } | null;
  expected: string | null;
  synced: string | null;
};

/**
 * Shipping one order with Delhivery: book it (Delhivery gives the waybill), print the label,
 * mark it handed over or cancel the booking; once on its way, refresh its tracking.
 * Shown on the admin order page for packed and shipped orders.
 */
export function DelhiveryPanel({ number, status, info }: { number: string; status: string; info: DelhiveryInfo }) {
  const [book, bookAction, booking] = useActionState<AdminState, FormData>(shipWithDelhivery, null);
  const [reply, setReply] = useState<AdminState>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [, start] = useTransition();

  const run = (key: string, action: () => Promise<AdminState>) => {
    setBusy(key);
    start(async () => {
      setReply(await action());
      setBusy(null);
      setConfirming(false);
    });
  };

  if (status === 'packed' && !info.booked) {
    return (
      <div className={styles.parcel}>
        <p className={styles.parcelHead}>
          <span className={styles.label}>Delhivery</span>
        </p>
        <form onSubmit={keepValues(bookAction)}>
          <input type="hidden" name="number" value={number} />
          <Field label="Parcel weight (grams)" name="weight_g" type="number" inputMode="numeric" min={50} max={50000} step={1} required defaultValue={info.weightG} />
          {info.needsEwaybill && <Field label="E-waybill number (12 digits)" name="ewaybill" inputMode="numeric" maxLength={12} required />}
          <SubmitButton pending={booking} busyLabel="Booking…">
            Book with Delhivery
          </SubmitButton>
          <FormStatus message={book?.message} ok={book?.ok} />
        </form>
      </div>
    );
  }

  if (!info.booked && !info.waybill) return null;

  return (
    <div className={styles.parcel}>
      <p className={styles.parcelHead}>
        <span className={styles.label}>Delhivery</span>
        {info.waybill && <span className={styles.waybill}>{info.waybill}</span>}
      </p>

      {info.latest ? (
        <p className={styles.parcelNews}>
          {info.latest.words}
          {info.latest.where ? ` · ${info.latest.where}` : ''}
          {info.latest.when && <span className={styles.muted}> · {info.latest.when}</span>}
        </p>
      ) : (
        <p className={styles.muted}>{status === 'packed' ? 'Booked. Waiting for Delhivery to collect it.' : 'No scans yet.'}</p>
      )}
      {info.expected && <p className={styles.muted}>Expected by {info.expected}</p>}

      {info.booked && (
        <p className={styles.parcelLinks}>
          Label:{' '}
          <a href={`/admin/label/${number}?size=A4`} target="_blank" rel="noreferrer" className="text-link">
            A4 sheet
          </a>{' '}
          ·{' '}
          <a href={`/admin/label/${number}?size=4R`} target="_blank" rel="noreferrer" className="text-link">
            4×6 label
          </a>
        </p>
      )}

      {status === 'packed' && info.booked && (
        <>
          <SubmitButton type="button" pending={busy === 'handed'} busyLabel="Saving…" onClick={() => run('handed', () => handedToDelhivery(number))}>
            Handed to Delhivery
          </SubmitButton>
          {confirming ? (
            <>
              <p>Cancel this Delhivery booking? The order stays packed and can be booked again.</p>
              <SubmitButton type="button" className="btn btn-red" pending={busy === 'cancel'} busyLabel="Cancelling…" onClick={() => run('cancel', () => cancelDelhiveryBooking(number))}>
                Yes, cancel the booking
              </SubmitButton>
              <button type="button" className="text-link" style={{ alignSelf: 'flex-start' }} onClick={() => setConfirming(false)}>
                Keep the booking
              </button>
            </>
          ) : (
            <button type="button" className="text-link" style={{ alignSelf: 'flex-start' }} onClick={() => setConfirming(true)}>
              Cancel booking
            </button>
          )}
        </>
      )}

      {(status === 'packed' || status === 'shipped') && (
        <button type="button" className="text-link" style={{ alignSelf: 'flex-start' }} disabled={busy === 'refresh'} onClick={() => run('refresh', () => refreshTracking(number))}>
          {busy === 'refresh' ? 'Asking Delhivery…' : 'Refresh tracking'}
        </button>
      )}
      {info.synced && <p className={styles.muted}>Last checked {info.synced}</p>}
      <FormStatus message={reply?.message} ok={reply?.ok} />
    </div>
  );
}
