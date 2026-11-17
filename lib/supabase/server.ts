import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { env } from '@/lib/env';
import type { Database } from './types';

/**
 * Three ways to reach the database, all server-side only. Nothing here may be imported by a
 * client component ('server-only' makes that a build error).
 *
 * - publicDb():   the publishable key, no user. Sees only what row-level security makes public
 *                 (the live catalogue). Use for storefront reads.
 * - userDb():     the publishable key plus the signed-in customer's Clerk token. Row-level
 *                 security limits every query to that customer's own rows.
 * - adminDb():    the secret key, which bypasses row-level security. Use only in webhooks,
 *                 trusted server jobs and the founder-only admin area, after checking access.
 */
const options = { auth: { persistSession: false, autoRefreshToken: false } } as const;

let publicClient: SupabaseClient<Database> | undefined;
let adminClient: SupabaseClient<Database> | undefined;

export function publicDb(): SupabaseClient<Database> {
  const e = env();
  return (publicClient ??= createClient<Database>(e.NEXT_PUBLIC_SUPABASE_URL, e.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options));
}

export async function userDb(): Promise<SupabaseClient<Database>> {
  const e = env();
  const { getToken } = await auth();
  return createClient<Database>(e.NEXT_PUBLIC_SUPABASE_URL, e.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    ...options,
    accessToken: async () => (await getToken()) ?? null,
  });
}

export function adminDb(): SupabaseClient<Database> {
  const e = env();
  return (adminClient ??= createClient<Database>(e.NEXT_PUBLIC_SUPABASE_URL, e.SUPABASE_SECRET_KEY, options));
}
