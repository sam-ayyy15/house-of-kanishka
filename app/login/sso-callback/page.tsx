import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { authEnabled } from '@/lib/auth-config';

// Google sends the visitor back here. Clerk finishes the sign-in (or creates the account
// on a first visit) and then forwards them to their account page.
export default function SsoCallbackPage() {
  if (!authEnabled) redirect('/login');
  return (
    <main className="page" style={{ display: 'grid', placeItems: 'center' }}>
      <p role="status" style={{ fontSize: 15 }}>
        Signing you in…
      </p>
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/account"
        signUpFallbackRedirectUrl="/account"
        signInUrl="/login"
        signUpUrl="/login"
      />
    </main>
  );
}
