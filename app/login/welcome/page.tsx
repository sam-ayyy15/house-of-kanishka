import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { WelcomeThenGo } from '@/components/auth/WelcomeThenGo';
import { Header } from '@/components/Header';
import { authEnabled } from '@/lib/auth-config';
import { isNewAccount } from '@/lib/new-account';
import { safeNext } from '@/lib/return-to';

export const metadata: Metadata = {
  title: 'Welcome · House of Kanishka',
  robots: { index: false, follow: false },
};

/**
 * Where Google sign-in lands: the same lotus and script welcome as a password sign-in, then
 * on to ?next= (own-site pages only). A new account (lib/new-account.ts) is greeted with
 * "Welcome to the house", everyone else with "Welcome back".
 */
export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const after = safeNext(next);
  if (!authEnabled) redirect('/login');
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(after)}`);
  const isNew = isNewAccount(user.createdAt);
  return (
    <>
      <Header />
      <main>
        <WelcomeThenGo next={after} kind={isNew ? 'new' : 'back'} />
      </main>
    </>
  );
}
