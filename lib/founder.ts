import 'server-only';
import { notFound } from 'next/navigation';
import { signedInUserId } from '@/lib/customer';

/**
 * The admin area belongs to one person: the founder, identified by FOUNDER_CLERK_USER_ID.
 * To everyone else (signed in or not) it does not exist: pages answer "not found" and
 * actions refuse. It is never linked from the site and never indexed.
 */
export async function isFounder(): Promise<boolean> {
  const founder = process.env.FOUNDER_CLERK_USER_ID;
  if (!founder) return false;
  return (await signedInUserId()) === founder;
}

/** For admin pages: carries on for the founder, shows the 404 page to anyone else. */
export async function requireFounder(): Promise<void> {
  if (!(await isFounder())) notFound();
}
