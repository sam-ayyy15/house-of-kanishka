'use client';

import { useAuth } from '@clerk/nextjs';
import { createContext, useContext } from 'react';

const AuthEnabledContext = createContext(false);

/** Tells client components whether Clerk is configured (see lib/auth-config.ts). */
export function AuthEnabledProvider({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  return <AuthEnabledContext.Provider value={enabled}>{children}</AuthEnabledContext.Provider>;
}

export const useAuthEnabled = () => useContext(AuthEnabledContext);

function SignedInLabel({ signedIn, signedOut }: { signedIn: React.ReactNode; signedOut: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  return <>{isSignedIn ? signedIn : signedOut}</>;
}

/**
 * Renders one thing for signed-in visitors and another for everyone else. Clerk's hooks
 * only work inside its provider, so they are only called when accounts are switched on.
 */
export function WhenSignedIn(props: { signedIn: React.ReactNode; signedOut: React.ReactNode }) {
  return useAuthEnabled() ? <SignedInLabel {...props} /> : <>{props.signedOut}</>;
}
