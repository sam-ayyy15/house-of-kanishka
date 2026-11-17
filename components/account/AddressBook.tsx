'use client';

import { useActionState, useEffect, useLayoutEffect, useRef, useState, useTransition } from 'react';
import { deleteAddress, saveAddress, setDefaultAddress, type AccountState } from '@/app/actions/account';
import { INDIAN_STATES } from '@/lib/india';
import { Drawer } from '../Drawer';
import { Emblem } from '../Emblem';
import { Field, SelectField } from '../form/Field';
import { FormStatus } from '../form/FormStatus';
import { SubmitButton } from '../form/SubmitButton';
import styles from './Account.module.css';

export type AddressCard = {
  id: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
};

/**
 * Cards glide to their new places when one is added, removed or made the default (FLIP:
 * measure before and after, then animate the difference with transform only).
 */
function useGlide(order: string) {
  const ref = useRef<HTMLUListElement>(null);
  const before = useRef(new Map<string, DOMRect>());

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const now = new Map<string, DOMRect>();
    for (const card of el.querySelectorAll<HTMLElement>('[data-id]')) {
      const rect = card.getBoundingClientRect();
      const id = card.dataset.id!;
      now.set(id, rect);
      const was = before.current.get(id);
      if (!was || reduce) continue;
      const dx = was.left - rect.left;
      const dy = was.top - rect.top;
      if (dx || dy) {
        card.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
          duration: 500,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        });
      }
    }
    before.current = now;
  }, [order]);

  return ref;
}

export function AddressBook({ addresses, defaultName }: { addresses: AddressCard[]; defaultName: string }) {
  // null = closed, 'new' = adding, otherwise the address being edited.
  const [editing, setEditing] = useState<AddressCard | 'new' | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [note, setNote] = useState<AccountState>(null);
  const [working, startWork] = useTransition();
  const known = useRef(new Set(addresses.map((a) => a.id)));
  const cards = useGlide(addresses.map((a) => a.id).join());

  const open = (target: AddressCard | 'new') => {
    setFormKey((k) => k + 1); // a fresh form each time
    setEditing(target);
  };
  const act = (action: () => Promise<AccountState>) => startWork(async () => setNote(await action()));

  // Cards that were not here on the previous render rise in.
  const fresh = addresses.filter((a) => !known.current.has(a.id)).map((a) => a.id);
  useEffect(() => {
    known.current = new Set(addresses.map((a) => a.id));
  }, [addresses]);

  return (
    <>
      <div className={styles.bar}>
        <p className="muted">
          {addresses.length === 0 ? 'No addresses yet' : `${addresses.length} ${addresses.length === 1 ? 'address' : 'addresses'} saved`}
        </p>
        <button type="button" className="btn btn-black" onClick={() => open('new')}>
          Add an address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className={styles.empty}>
          <Emblem bloom="load" className={styles.emptyEmblem} />
          <p className={styles.serif}>Save an address and checkout takes a moment.</p>
        </div>
      ) : (
        <ul ref={cards} className={styles.cards}>
          {addresses.map((a) => (
            <li key={a.id} data-id={a.id} className={styles.card} data-new={fresh.includes(a.id) ? '' : undefined}>
              <div className={styles.cardHead}>
                <p className={styles.cardName}>{a.full_name}</p>
                {a.is_default && <span className={styles.tag}>Default</span>}
              </div>
              <p className={styles.cardLines}>
                {a.line1}
                {a.line2 && (
                  <>
                    <br />
                    {a.line2}
                  </>
                )}
                <br />
                {a.city}, {a.state} {a.pincode}
                <br />
                +91 {a.phone.slice(0, 5)} {a.phone.slice(5)}
              </p>
              <div className={styles.cardActions}>
                <button type="button" className="text-link" onClick={() => open(a)}>
                  Edit
                </button>
                {!a.is_default && (
                  <button type="button" className="text-link" disabled={working} onClick={() => act(() => setDefaultAddress(a.id))}>
                    Make default
                  </button>
                )}
                <button type="button" className="text-link" disabled={working} onClick={() => act(() => deleteAddress(a.id))}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <FormStatus message={note?.message} ok={note?.ok} />

      <Drawer open={editing !== null} onClose={() => setEditing(null)} side="right" label={editing === 'new' ? 'Add an address' : 'Edit address'}>
        {editing !== null && (
          <AddressForm
            key={formKey}
            address={editing === 'new' ? null : editing}
            defaultName={defaultName}
            first={addresses.length === 0}
            onSaved={(state) => {
              setNote(state);
              setEditing(null);
            }}
          />
        )}
      </Drawer>
    </>
  );
}

function AddressForm({
  address,
  defaultName,
  first,
  onSaved,
}: {
  address: AddressCard | null;
  defaultName: string;
  first: boolean;
  onSaved: (state: AccountState) => void;
}) {
  const [state, action, pending] = useActionState<AccountState, FormData>(saveAddress, null);
  const err = state?.fields ?? {};

  useEffect(() => {
    if (state?.ok) onSaved(state);
  }, [state, onSaved]);

  // What the customer typed is kept when the server sends the form back with errors.
  const [values, setValues] = useState(() => ({
    full_name: address?.full_name ?? defaultName,
    phone: address?.phone ?? '',
    line1: address?.line1 ?? '',
    line2: address?.line2 ?? '',
    city: address?.city ?? '',
    state: address?.state ?? '',
    pincode: address?.pincode ?? '',
  }));
  const bind = (name: keyof typeof values) => ({
    name,
    value: values[name],
    error: err[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setValues((v) => ({ ...v, [name]: e.target.value })),
  });

  return (
    <form action={action} className={styles.drawerForm} noValidate>
      <h2 className={styles.drawerTitle}>{address ? 'Edit address' : 'Add an address'}</h2>
      {address && <input type="hidden" name="id" value={address.id} />}
      <Field label="Full name" autoComplete="name" required maxLength={120} {...bind('full_name')} />
      <Field label="Mobile number" type="tel" inputMode="tel" autoComplete="tel-national" required maxLength={16} {...bind('phone')} />
      <Field label="House number and street" autoComplete="address-line1" required maxLength={200} {...bind('line1')} />
      <Field label="Area or landmark (optional)" autoComplete="address-line2" maxLength={200} {...bind('line2')} />
      <div className={styles.two}>
        <Field label="City" autoComplete="address-level2" required maxLength={80} {...bind('city')} />
        <Field label="PIN code" inputMode="numeric" autoComplete="postal-code" required maxLength={6} {...bind('pincode')} />
      </div>
      <SelectField label="State" autoComplete="address-level1" required {...bind('state')}>
        <option value="">Choose a state</option>
        {INDIAN_STATES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </SelectField>
      {!first && !address?.is_default && (
        <label className="check">
          <input type="checkbox" name="is_default" />
          <span>Make this my default address</span>
        </label>
      )}
      <SubmitButton pending={pending} busyLabel="Saving…">
        Save address
      </SubmitButton>
      <FormStatus message={state && !state.ok ? state.message : null} />
    </form>
  );
}
