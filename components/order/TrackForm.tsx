'use client';

import { useActionState } from 'react';
import { findOrder, type TrackState } from '@/app/actions/track';
import { Field } from '../form/Field';
import { FormStatus } from '../form/FormStatus';
import { keepValues } from '../form/keep';
import { SubmitButton } from '../form/SubmitButton';
import styles from './Track.module.css';

export function TrackForm() {
  const [state, action, pending] = useActionState<TrackState, FormData>(findOrder, null);
  return (
    <form onSubmit={keepValues(action)} className={styles.find}>
      <Field label="Order number" name="number" autoComplete="off" required maxLength={16} />
      <Field label="Email used for the order" type="email" name="email" autoComplete="email" required />
      <SubmitButton pending={pending} busyLabel="Looking…">
        Track order
      </SubmitButton>
      <FormStatus message={state?.message} />
    </form>
  );
}
