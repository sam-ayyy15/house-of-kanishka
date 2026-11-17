/**
 * Error monitoring without a paid service: every error the server hits while rendering a
 * page or running an action is written to the `error_log` table, and the admin area shows
 * them (Admin → Today → Errors). Only the path (without its query string, which can carry
 * private order tokens), the message and Next.js' error code are kept.
 *
 * "Not found" and redirects are not errors and are skipped. Logging must never cause a
 * second failure, so everything here is wrapped and silent.
 */
export async function onRequestError(
  error: unknown,
  request: { path: string; method: string },
  context: { routerKind: string; routeType: string; routePath: string },
) {
  try {
    const err = error as { message?: string; digest?: string };
    const digest = typeof err?.digest === 'string' ? err.digest : null;
    if (digest && /^(NEXT_REDIRECT|NEXT_NOT_FOUND|NEXT_HTTP_ERROR_FALLBACK)/.test(digest)) return;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) return;
    await fetch(`${url}/rest/v1/error_log`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        path: (context.routePath || request.path.split('?')[0]).slice(0, 300),
        message: String(err?.message ?? error).slice(0, 1000),
        digest: digest?.slice(0, 100) ?? null,
        kind: `${request.method} ${context.routeType}`.slice(0, 60),
      }),
    });
  } catch {
    // Never let the error log break the page that is already failing.
  }
}
