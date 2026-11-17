'use client';

import { useActionState } from 'react';
import { savePreferences, type AccountState } from '@/app/actions/account';
import { FormStatus } from '../form/FormStatus';
import { keepValues } from '../form/keep';
import { SubmitButton } from '../form/SubmitButton';

/** Newsletter consent for the signed-in customer. The choice and its time are recorded. */
export function PreferencesForm({ subscribed, email }: { subscribed: boolean; email: string | null }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(savePreferences, null);
  return (
    <form onSubmit={keepValues(action)}>
      <label className="check">
        <input type="checkbox" name="newsletter" defaultChecked={subscribed} />
        <span>
          Send me letters about new collections and exclusive offers
          {email ? (
            <>
              , at <strong style={{ fontWeight: 500, overflowWrap: 'anywhere' }}>{email}</strong>
            </>
          ) : null}
          . You can change this at any time.
        </span>
      </label>
      <SubmitButton pending={pending} busyLabel="Saving…">
        Save preferences
      </SubmitButton>
      <FormStatus message={state?.message} ok={state?.ok} />
    </form>
  );
}
