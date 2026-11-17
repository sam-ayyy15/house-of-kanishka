import 'server-only';
import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { signedInUserId } from '@/lib/customer';
import { isFounder } from '@/lib/founder';

/**
 * The admin area's second lock. The founder's account opens the door (lib/founder.ts:
 * everyone else gets "not found"); the admin password then unlocks the room for a few hours.
 *
 * The password itself is never stored: ADMIN_PASSWORD_HASH holds a scrypt hash
 * ("scrypt$<salt>$<hash>", base64url). A correct password sets a signed, http-only cookie
 * bound to the founder's account. Its signing key is derived from that hash and a server
 * secret, so changing the password signs every open admin session out.
 */
const COOKIE = 'hok_admin';
const HOURS = 8;
export const ADMIN_UNLOCK_HOURS = HOURS;

export const adminPasswordConfigured = () => !!process.env.ADMIN_PASSWORD_HASH;

const same = (a: Buffer, b: Buffer) => a.length === b.length && timingSafeEqual(a, b);

/** Checks a typed password against ADMIN_PASSWORD_HASH (constant-time). */
export function checkAdminPassword(password: string): boolean {
  const [scheme, salt, hash] = (process.env.ADMIN_PASSWORD_HASH ?? '').split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64url');
  const got = scryptSync(password.normalize('NFC'), Buffer.from(salt, 'base64url'), expected.length, { N: 16384, r: 8, p: 1 });
  return same(got, expected);
}

const signingKey = () =>
  createHmac('sha256', process.env.SUPABASE_SECRET_KEY ?? 'hok').update(`admin-gate:${process.env.ADMIN_PASSWORD_HASH ?? ''}`).digest();
const sign = (payload: string) => createHmac('sha256', signingKey()).update(payload).digest('base64url');

/** After a correct password (from a server action): unlock the admin area for this account. */
export async function grantAdmin(userId: string): Promise<void> {
  const payload = `${userId}.${Date.now() + HOURS * 3600_000}`;
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/admin',
    maxAge: HOURS * 3600,
  });
}

/** Locks the admin area again (from a server action). */
export async function revokeAdmin(): Promise<void> {
  (await cookies()).set(COOKIE, '', { path: '/admin', maxAge: 0 });
}

async function unlockedFor(userId: string): Promise<boolean> {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value || !adminPasswordConfigured()) return false;
  const cut = value.lastIndexOf('.');
  const payload = value.slice(0, cut);
  const [owner, expires] = payload.split('.');
  if (owner !== userId || !(Number(expires) > Date.now())) return false;
  return same(Buffer.from(value.slice(cut + 1)), Buffer.from(sign(payload)));
}

/** The founder, with the admin area unlocked. Every admin action checks this. */
export async function isAdmin(): Promise<boolean> {
  if (!(await isFounder())) return false;
  const userId = await signedInUserId();
  return !!userId && unlockedFor(userId);
}

/** Whether the signed-in founder has already unlocked the admin area. */
export async function founderUnlocked(): Promise<boolean> {
  const userId = await signedInUserId();
  return !!userId && unlockedFor(userId);
}

/**
 * For admin pages: anyone but the founder sees "not found"; the founder, until the password
 * is entered, is sent to the unlock page (and brought back to `path` afterwards).
 */
export async function requireAdmin(path = '/admin'): Promise<void> {
  if (!(await isFounder())) notFound();
  if (!(await founderUnlocked())) redirect(`/admin/unlock?next=${encodeURIComponent(path)}`);
}
