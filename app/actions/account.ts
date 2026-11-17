'use server';

import { clerkClient } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { syncBrevoContact } from '@/lib/brevo';
import { ensureProfile, eraseCustomer, signedInUserId } from '@/lib/customer';
import { INDIAN_STATES, indianMobile, PINCODE } from '@/lib/india';
import { adminDb } from '@/lib/supabase/server';

/**
 * Account changes. Every action reads the customer's id from the signed-in session (never
 * from the form) and limits each query to that id.
 */
export type AccountState = { ok: boolean; message: string; fields?: Record<string, string> } | null;

const SIGN_IN: AccountState = { ok: false, message: 'Please sign in again to continue.' };
const FAILED: AccountState = { ok: false, message: 'Something went wrong on our side. Please try again.' };
const MAX_ADDRESSES = 10;

const refresh = () => revalidatePath('/account', 'layout');

// ---------- Addresses ----------

const addressInput = z.object({
  full_name: z.string().trim().min(2, 'Please enter the full name.').max(120),
  phone: z.string().transform((v, ctx) => {
    const mobile = indianMobile(v);
    if (!mobile) {
      ctx.addIssue({ code: 'custom', message: 'Please enter a 10-digit Indian mobile number.' });
      return z.NEVER;
    }
    return mobile;
  }),
  line1: z.string().trim().min(3, 'Please enter the house number and street.').max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2, 'Please enter the city.').max(80),
  state: z.enum(INDIAN_STATES, 'Please choose a state.'),
  pincode: z.string().trim().regex(PINCODE, 'Please enter a 6-digit PIN code.'),
});

export async function saveAddress(_prev: AccountState, form: FormData): Promise<AccountState> {
  const userId = await signedInUserId();
  if (!userId) return SIGN_IN;

  const text = (k: string) => String(form.get(k) ?? '');
  const parsed = addressInput.safeParse({
    full_name: text('full_name'),
    phone: text('phone'),
    line1: text('line1'),
    line2: text('line2') || undefined,
    city: text('city'),
    state: text('state'),
    pincode: text('pincode'),
  });
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0])] ??= issue.message;
    return { ok: false, message: 'Please check the marked fields.', fields };
  }

  await ensureProfile(userId);
  const db = adminDb();
  const id = text('id');
  const wantsDefault = form.get('is_default') === 'on';
  const row = { ...parsed.data, line2: parsed.data.line2 ?? null };

  const existing = await db.from('addresses').select('id, is_default').eq('clerk_user_id', userId);
  if (existing.error) return FAILED;
  const current = existing.data.find((a) => a.id === id);
  if (id && !current) return { ok: false, message: 'That address no longer exists.' };
  if (!id && existing.data.length >= MAX_ADDRESSES) {
    return { ok: false, message: `You can keep up to ${MAX_ADDRESSES} addresses. Please remove one first.` };
  }

  // The first address is always the default; otherwise only when asked.
  const makeDefault = wantsDefault || existing.data.length === 0 || (!!current?.is_default && existing.data.length === 1);
  if (makeDefault && !current?.is_default) {
    const cleared = await db.from('addresses').update({ is_default: false }).eq('clerk_user_id', userId).eq('is_default', true);
    if (cleared.error) return FAILED;
  }
  const saved = id
    ? await db.from('addresses').update({ ...row, is_default: makeDefault || !!current?.is_default }).eq('id', id).eq('clerk_user_id', userId)
    : await db.from('addresses').insert({ ...row, clerk_user_id: userId, is_default: makeDefault });
  if (saved.error) return FAILED;

  refresh();
  return { ok: true, message: id ? 'Address updated.' : 'Address saved.' };
}

export async function deleteAddress(id: string): Promise<AccountState> {
  const userId = await signedInUserId();
  if (!userId) return SIGN_IN;
  if (!z.uuid().safeParse(id).success) return FAILED;
  const db = adminDb();
  const removed = await db.from('addresses').delete().eq('id', id).eq('clerk_user_id', userId).select('is_default');
  if (removed.error) return FAILED;
  // If the default went, the most recent remaining address takes its place.
  if (removed.data[0]?.is_default) {
    const next = await db.from('addresses').select('id').eq('clerk_user_id', userId).order('created_at', { ascending: false }).limit(1);
    if (next.data?.[0]) await db.from('addresses').update({ is_default: true }).eq('id', next.data[0].id).eq('clerk_user_id', userId);
  }
  refresh();
  return { ok: true, message: 'Address removed.' };
}

export async function setDefaultAddress(id: string): Promise<AccountState> {
  const userId = await signedInUserId();
  if (!userId) return SIGN_IN;
  if (!z.uuid().safeParse(id).success) return FAILED;
  const db = adminDb();
  const owned = await db.from('addresses').select('id').eq('id', id).eq('clerk_user_id', userId).maybeSingle();
  if (!owned.data) return { ok: false, message: 'That address no longer exists.' };
  const cleared = await db.from('addresses').update({ is_default: false }).eq('clerk_user_id', userId).eq('is_default', true);
  if (cleared.error) return FAILED;
  const set = await db.from('addresses').update({ is_default: true }).eq('id', id).eq('clerk_user_id', userId);
  if (set.error) return FAILED;
  refresh();
  return { ok: true, message: 'Default address changed.' };
}

// ---------- Preferences (newsletter consent) ----------

export async function savePreferences(_prev: AccountState, form: FormData): Promise<AccountState> {
  const userId = await signedInUserId();
  if (!userId) return SIGN_IN;
  const profile = await ensureProfile(userId);
  const wants = form.get('newsletter') === 'on';
  const db = adminDb();

  const updated = await db.from('profiles').update({ marketing_opt_in: wants }).eq('clerk_user_id', userId);
  if (updated.error) return FAILED;

  if (profile.email) {
    // The account's email is already verified by sign-in, so no second confirmation is needed.
    const now = new Date().toISOString();
    const existing = await db.from('newsletter_subscribers').select('id').eq('email', profile.email).maybeSingle();
    const change = wants
      ? { status: 'confirmed', confirmed_at: now, unsubscribed_at: null }
      : { status: 'unsubscribed', unsubscribed_at: now };
    const saved = existing.data
      ? await db.from('newsletter_subscribers').update(change).eq('id', existing.data.id)
      : wants
        ? await db.from('newsletter_subscribers').insert({ email: profile.email, source: 'account', ...change })
        : { error: null };
    if (saved.error) return FAILED;
    await syncBrevoContact(profile.email, wants);
  }
  await db.from('consent_log').insert({ clerk_user_id: userId, email: profile.email, kind: 'newsletter', granted: wants, source: 'account-preferences' });

  refresh();
  return { ok: true, message: wants ? 'You are on our list.' : 'You will not receive our letters.' };
}

// ---------- Delete the account ----------

/** Deletes the sign-in at Clerk and erases the personal data we hold. Cannot be undone. */
export async function deleteAccount(): Promise<AccountState> {
  const userId = await signedInUserId();
  if (!userId) return SIGN_IN;
  try {
    await (await clerkClient()).users.deleteUser(userId);
  } catch {
    return { ok: false, message: 'We could not delete the account just now. Please try again.' };
  }
  // The Clerk webhook does this too; doing it here means it never depends on the webhook.
  await eraseCustomer(userId);
  return { ok: true, message: 'Your account has been deleted.' };
}
