/**
 * Whether an account is new enough to be greeted with "Welcome to the house" rather than
 * "Welcome back": made within the last ten minutes. One rule for every greeting (the
 * welcome after Google sign-in and the account overview), so they never disagree.
 */
export const NEW_ACCOUNT_MS = 10 * 60 * 1000;

export function isNewAccount(createdAt: string | number | Date | null | undefined, now = Date.now()): boolean {
  if (createdAt == null) return false;
  const t = new Date(createdAt).getTime();
  return Number.isFinite(t) && now - t < NEW_ACCOUNT_MS;
}
