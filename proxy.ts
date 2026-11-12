import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextFetchEvent, type NextMiddleware, type NextRequest } from 'next/server';

// Next.js 16 request proxy (formerly middleware). Clerk reads and refreshes the session
// cookie here; the account area is only reachable when signed in.
const isAccountRoute = createRouteMatcher(['/account(.*)']);

// Built on first use, so nothing from Clerk runs while its keys are missing.
let withClerk: NextMiddleware | undefined;
const clerk = () =>
  (withClerk ??= clerkMiddleware(
    async (auth, req) => {
      if (isAccountRoute(req)) await auth.protect();
    },
    { signInUrl: '/login', signUpUrl: '/login' },
  ));

export default function proxy(req: NextRequest, event: NextFetchEvent) {
  // No Clerk keys yet: accounts are switched off and every request passes straight through
  // (the account pages themselves send visitors to /login).
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
    return NextResponse.next();
  }
  return clerk()(req, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|webm|mp4)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
