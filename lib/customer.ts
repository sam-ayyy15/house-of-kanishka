import 'server-only';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { authEnabled } from '@/lib/auth-config';
import { loginHref } from '@/lib/return-to';
import { adminDb } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Address = Database['public']['Tables']['addresses']['Row'];

/** The signed-in customer's Clerk id, or null for a guest (or while accounts are switched off). */
export async function signedInUserId(): Promise<string | null> {
  if (!authEnabled) return null;
  return (await auth()).userId;
}

/** For account pages: the customer's id, or a redirect to login that comes back to `path`. */
export async function requireUserId(path = '/account'): Promise<string> {
  const userId = await signedInUserId();
  if (!userId) redirect(authEnabled ? loginHref(path) : '/login');
  return userId;
}

type ClerkPerson = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
};

/** Writes the account's name and email into `profiles`. Used by the Clerk webhook and by ensureProfile(). */
export async function saveProfile(p: ClerkPerson) {
  return adminDb()
    .from('profiles')
    .upsert(
      { clerk_user_id: p.id, email: p.email, first_name: p.firstName, last_name: p.lastName, deleted_at: null },
      { onConflict: 'clerk_user_id' },
    )
    .select()
    .single();
}

/**
 * The customer's profile row. Normally the Clerk webhook has already created it; if the
 * webhook is late or not set up, the row is created here from the signed-in session.
 */
export async function ensureProfile(userId: string): Promise<Profile> {
  const db = adminDb();
  const found = await db.from('profiles').select().eq('clerk_user_id', userId).maybeSingle();
  if (found.data && !found.data.deleted_at) return found.data;
  const user = await currentUser();
  if (!user || user.id !== userId) throw new Error('No signed-in customer to create a profile for.');
  const saved = await saveProfile({
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress ?? null,
    firstName: user.firstName,
    lastName: user.lastName,
  });
  if (saved.error) throw new Error(`Could not create the profile: ${saved.error.message}`);
  return saved.data;
}

/**
 * Account deletion (DPDP Act): removes the customer's addresses, saved bag, wishlist and
 * newsletter subscription, and strips the personal details from the profile row. The bare
 * row stays so that later order records (kept for accounting) still have something to point to.
 */
export async function eraseCustomer(userId: string) {
  const db = adminDb();
  const profile = await db.from('profiles').select('email').eq('clerk_user_id', userId).maybeSingle();
  await Promise.all([
    db.from('addresses').delete().eq('clerk_user_id', userId),
    db.from('bag_items').delete().eq('clerk_user_id', userId),
    db.from('wishlist_items').delete().eq('clerk_user_id', userId),
    profile.data?.email ? db.from('newsletter_subscribers').delete().eq('email', profile.data.email) : null,
    profile.data?.email ? db.from('launch_waitlist').delete().eq('email', profile.data.email) : null,
  ]);
  return db
    .from('profiles')
    .update({ email: null, first_name: null, last_name: null, phone: null, marketing_opt_in: false, deleted_at: new Date().toISOString() })
    .eq('clerk_user_id', userId);
}
