import 'server-only';
import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { adminDb } from '@/lib/supabase/server';

/**
 * A small rate limit for public forms, kept in the database (no extra service needed).
 * The visitor is identified by a salted hash of their IP address: the address itself is
 * never stored. Returns true while the caller is within the limit.
 */
export async function withinRateLimit(action: string, maxHits: number, windowSeconds: number): Promise<boolean> {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
  const who = createHash('sha256').update(`hok:${action}:${ip}`).digest('hex').slice(0, 32);
  const { data, error } = await adminDb().rpc('rate_limit_hit', {
    p_bucket: `${action}:${who}`,
    p_window_seconds: windowSeconds,
    p_max_hits: maxHits,
  });
  // If the check itself fails, let the request through rather than block real customers.
  return error ? true : data === true;
}
