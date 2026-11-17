'use server';

import { redirect } from 'next/navigation';
import { adminPasswordConfigured, checkAdminPassword, grantAdmin, revokeAdmin } from '@/lib/admin-gate';
import { signedInUserId } from '@/lib/customer';
import { isFounder } from '@/lib/founder';
import { withinRateLimit } from '@/lib/rate-limit';

export type UnlockState = { ok: boolean; message: string } | null;

/** The admin password form. Only the founder may try, five times every fifteen minutes. */
export async function unlockAdmin(_prev: UnlockState, form: FormData): Promise<UnlockState> {
  if (!(await isFounder())) return { ok: false, message: 'Not allowed.' };
  if (!adminPasswordConfigured()) return { ok: false, message: 'The admin password has not been set up yet.' };
  if (!(await withinRateLimit('admin-unlock', 5, 15 * 60))) {
    return { ok: false, message: 'Too many tries. Please wait fifteen minutes and try again.' };
  }
  const password = String(form.get('password') ?? '');
  if (!password || !checkAdminPassword(password)) return { ok: false, message: 'That is not the password. Please try again.' };
  const userId = await signedInUserId();
  if (!userId) return { ok: false, message: 'Not allowed.' };
  await grantAdmin(userId);
  return { ok: true, message: 'Unlocked.' };
}

/** "Lock admin": closes the admin area until the password is entered again. */
export async function lockAdmin(): Promise<void> {
  await revokeAdmin();
  redirect('/admin/unlock');
}
