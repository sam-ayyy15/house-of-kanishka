import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { AccountView } from '@/components/auth/AccountView';
import { Header } from '@/components/Header';
import { authEnabled } from '@/lib/auth-config';

export const metadata: Metadata = { title: 'Account · House of Kanishka' };

// The page checks sign-in itself (Clerk's recommended resource-based check), so it stays
// protected even if the proxy's path matching ever misses it.
export default async function AccountPage() {
  if (!authEnabled) redirect('/login');
  const { userId } = await auth();
  if (!userId) redirect('/login'); // login returns to /account after sign-in
  return (
    <>
      <Header />
      <main className="page">
        <AccountView />
      </main>
    </>
  );
}
