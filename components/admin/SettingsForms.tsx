'use client';

import { useActionState, useState, useTransition } from 'react';
import { saveSettings, setCategoryLaunch, type AdminState } from '@/app/actions/admin';
import { Field } from '../form/Field';
import { FormStatus } from '../form/FormStatus';
import { keepValues } from '../form/keep';
import { SubmitButton } from '../form/SubmitButton';
import styles from './Admin.module.css';

export function SettingsForm({ freeFrom, fee, codEnabled, codMax }: { freeFrom: number; fee: number; codEnabled: boolean; codMax: number }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(saveSettings, null);
  const number = { type: 'number', inputMode: 'numeric', min: 0, step: 1, required: true } as const;
  return (
    <form onSubmit={keepValues(action)}>
      <Field label="Free shipping from (₹)" name="free_shipping_threshold_inr" defaultValue={freeFrom} {...number} />
      <Field label="Shipping fee below that (₹)" name="shipping_fee_inr" defaultValue={fee} {...number} />
      <label className="check">
        <input type="checkbox" name="cod_enabled" defaultChecked={codEnabled} />
        <span>Offer cash on delivery</span>
      </label>
      <Field label="Largest cash-on-delivery order (₹, 0 = no limit)" name="cod_max_order_inr" defaultValue={codMax} {...number} />
      <SubmitButton pending={pending} busyLabel="Saving…">
        Save
      </SubmitButton>
      <FormStatus message={state?.message} ok={state?.ok} />
    </form>
  );
}

/** Puts a category on sale, or back to "coming soon". Asks once before going live. */
export function LaunchSwitch({ slug, live }: { slug: string; live: boolean }) {
  const [asking, setAsking] = useState(false);
  const [reply, setReply] = useState<AdminState>(null);
  const [pending, start] = useTransition();
  const flip = () =>
    start(async () => {
      setReply(await setCategoryLaunch(slug, live ? 'coming_soon' : 'live'));
      setAsking(false);
    });

  return (
    <div style={{ width: '100%' }}>
      <div className={styles.switch}>
        <span className={styles.switchName}>{slug}</span>
        <span className={styles.tag} data-tone={live ? 'black' : undefined}>
          {live ? 'On sale' : 'Coming soon'}
        </span>
        {asking ? (
          <span style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <SubmitButton type="button" pending={pending} busyLabel="Saving…" className="btn btn-red" onClick={flip}>
              {live ? 'Yes, take off sale' : 'Yes, launch'}
            </SubmitButton>
            <button type="button" className="text-link" onClick={() => setAsking(false)}>
              No
            </button>
          </span>
        ) : (
          <button type="button" className="text-link" onClick={() => setAsking(true)}>
            {live ? 'Set to coming soon' : 'Launch'}
          </button>
        )}
      </div>
      <FormStatus message={reply?.message} ok={reply?.ok} />
    </div>
  );
}
