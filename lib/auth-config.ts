// Sign-in is provided by Clerk and needs two keys in the environment (.env.local in
// development). Until they exist the site runs normally with accounts switched off,
// instead of failing on every page.
export const authEnabled =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !!process.env.CLERK_SECRET_KEY;
