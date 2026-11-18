import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthView } from '@/components/auth/AuthView';
import authStyles from '@/components/auth/AuthView.module.css';
import { Eyebrow } from '@/components/Eyebrow';
import { Header } from '@/components/Header';
import { authEnabled } from '@/lib/auth-config';
import { safeNext } from '@/lib/return-to';

export const metadata: Metadata = {
  title: 'Login · House of Kanishka',
  robots: { index: false, follow: false },
};

/**
 * ?next=/some/page (ours) or ?redirect_url=… (added by Clerk when a protected page sends a
 * visitor here) says where to go after signing in. Only pages on this site are accepted.
 */
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; redirect_url?: string; tab?: string }> }) {
  const { next, redirect_url, tab } = await searchParams;
  const after = next ? safeNext(next) : redirect_url ? safeNext(redirect_url, new URL(redirect_url, 'https://site.invalid').origin) : safeNext(null);
  return (
    <>
      <Header />
      <main>
        {authEnabled ? (
          <AuthView next={after} start={tab === 'create' ? 'create' : 'signin'} />
        ) : (
          // Shown only until the Clerk keys are added (see lib/auth-config.ts).
          <AuthShell>
            <Eyebrow>Account</Eyebrow>
            <h1 className={authStyles.title}>Sign-in opens soon</h1>
            <p className={authStyles.lede}>
              Accounts aren’t switched on yet. Your bag and wishlist are kept in this browser in the meantime.
            </p>
            <Link href="/new-arrivals" className="btn btn-black">
              Shop new arrivals
            </Link>
          </AuthShell>
        )}
      </main>
    </>
  );
}
