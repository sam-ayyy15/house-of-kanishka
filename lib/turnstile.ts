import 'server-only';
import { headers } from 'next/headers';
import { SITE_URL } from '@/lib/site';

/**
 * Cloudflare Turnstile (Invisible mode): a free, privacy-friendly check that a form was sent
 * by a person. Nothing appears on screen. The privacy policy references Cloudflare's Turnstile
 * Privacy Addendum, a condition of Invisible mode.
 *
 * Switched off until NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY are set; the
 * rate limits and the hidden "company" field keep protecting the forms in the meantime.
 */
export const turnstileConfigured = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !!process.env.TURNSTILE_SECRET_KEY;

export const TURNSTILE_FAILED = 'We couldn’t confirm this was sent by a person. Please wait a moment and try again.';

/**
 * The pages a token may come from: TURNSTILE_HOSTNAMES (comma-separated), or this site's own
 * address and its bare domain. localhost only while developing, never in production.
 */
function allowedHostnames(): Set<string> {
  const listed = (process.env.TURNSTILE_HOSTNAMES ?? '').split(',').map((h) => h.trim()).filter(Boolean);
  const site = new URL(SITE_URL).hostname;
  const hosts = new Set(listed.length ? listed : [site, site.replace(/^www\./, '')]);
  if (process.env.NODE_ENV !== 'production') ['localhost', '127.0.0.1'].forEach((h) => hosts.add(h));
  return hosts;
}

/**
 * Cloudflare's canonical server-side check (developers.cloudflare.com/turnstile/spin): the
 * token must be valid (`success`), earned on this form (`action`) and on this site
 * (`hostname`). Anything else, including Cloudflare being unreachable, is refused.
 */
export async function verifyTurnstile(token: unknown, action: string): Promise<boolean> {
  if (!turnstileConfigured) return true;
  if (typeof token !== 'string' || token.length === 0 || token.length > 2048) return false;
  const h = await headers();
  const ip = h.get('cf-connecting-ip') || h.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY!, response: token, ...(ip ? { remoteip: ip } : {}) }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return false;
    const result = (await res.json()) as { success?: boolean; action?: string; hostname?: string };
    return result.success === true && result.action === action && !!result.hostname && allowedHostnames().has(result.hostname);
  } catch {
    return false;
  }
}
