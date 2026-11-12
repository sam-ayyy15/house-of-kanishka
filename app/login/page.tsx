import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthView } from '@/components/auth/AuthView';
import authStyles from '@/components/auth/AuthView.module.css';
import { Eyebrow } from '@/components/Eyebrow';
import { Header } from '@/components/Header';
import { authEnabled } from '@/lib/auth-config';

export const metadata: Metadata = { title: 'Login · House of Kanishka' };

export default function LoginPage() {
  return (
    <>
      <Header />
      <main>
        {authEnabled ? (
          <AuthView />
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
