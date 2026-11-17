/**
 * Where to send a customer after signing in. Only paths on this site are allowed: anything
 * else (another website, a protocol-relative "//host" address, the login page itself) falls
 * back to the account page. Accepts our own `next` value or Clerk's absolute `redirect_url`.
 */
export const DEFAULT_AFTER_SIGN_IN = '/account';

export function safeNext(value: string | null | undefined, origin?: string): string {
  if (!value) return DEFAULT_AFTER_SIGN_IN;
  try {
    const base = origin ?? 'https://site.invalid';
    const url = new URL(value, base);
    if (url.origin !== base) return DEFAULT_AFTER_SIGN_IN;
    // Reject "//host", "/\host" and control characters, which some browsers read as another site.
    if (!value.startsWith(base) && (!value.startsWith('/') || /^\/[/\\]/.test(value) || /[\u0000-\u001f]/.test(value))) {
      return DEFAULT_AFTER_SIGN_IN;
    }
    if (url.pathname === '/login' || url.pathname.startsWith('/login/') || url.pathname.startsWith('/api/')) return DEFAULT_AFTER_SIGN_IN;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_AFTER_SIGN_IN;
  }
}

/** A link to the login page that returns to `path` afterwards. */
export const loginHref = (path: string) => `/login?next=${encodeURIComponent(path)}`;
