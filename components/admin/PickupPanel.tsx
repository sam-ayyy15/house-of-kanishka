'use client';

import { useActionState } from 'react';
import type { AdminState } from '@/app/actions/admin';
import { bookPickup } from '@/app/actions/delhivery';
import { Field, SelectField } from '../form/Field';
import { FormStatus } from '../form/FormStatus';
import { keepValues } from '../form/keep';
import { SubmitButton } from '../form/SubmitButton';
import styles from './Admin.module.css';

type Props = {
  /** Parcels booked with Delhivery and still waiting to be collected. */
  ready: number;
  /** The last pickup asked for, already worded (e.g. "Wednesday 19 November, 11 am · Udupi centre · request 118775"). */
  last: string | null;
  firstDay: string;
  lastDay: string;
  hours: readonly string[];
};

const hourLabel = (t: string) => {
  const h = Number(t.slice(0, 2));
  return `${h % 12 || 12} ${h < 12 ? 'am' : 'pm'}`;
};

/**
 * Asks Delhivery to send a rider for the day's parcels. One request covers every parcel at our
 * pickup address; Delhivery takes one open request per day.
 */
export function PickupPanel({ ready, last, firstDay, lastDay, hours }: Props) {
  const [state, action, pending] = useActionState<AdminState, FormData>(bookPickup, null);
  return (
    <section className={styles.pickup} aria-label="Delhivery pickup">
      <div>
        <p className={styles.label}>Delhivery pickup</p>
        <p className={styles.pickupBooked}>
          {ready === 0 ? 'No parcels waiting' : `${ready} ${ready === 1 ? 'parcel' : 'parcels'} waiting to be collected`}
        </p>
        {last && <p className={styles.muted}>Last booked: {last}</p>}
      </div>
      <form className={styles.pickupForm} onSubmit={keepValues(action)}>
        <Field label="Date" name="date" type="date" min={firstDay} max={lastDay} defaultValue={firstDay} required />
        <SelectField label="Time" name="time" defaultValue="11:00:00" required>
          {hours.map((h) => (
            <option key={h} value={h}>
              {hourLabel(h)}
            </option>
          ))}
        </SelectField>
        <Field label="Parcels" name="count" type="number" inputMode="numeric" min={1} max={99} defaultValue={Math.max(ready, 1)} required />
        <SubmitButton pending={pending} busyLabel="Booking…">
          Book a pickup
        </SubmitButton>
        <FormStatus message={state?.message} ok={state?.ok} />
      </form>
    </section>
  );
}
