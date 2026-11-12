import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AccountView } from '@/components/auth/AccountView';
import { Header } from '@/components/Header';
import { authEnabled } from '@/lib/auth-config';

export const metadata: Metadata = { title: 'Account · House of Kanishka' };

// Signed-out visitors never reach this page: proxy.ts sends them to /login first.
export default function AccountPage() {
  if (!authEnabled) redirect('/login');
  return (
    <>
      <Header />
      <main className="page">
        <AccountView />
      </main>
    </>
  );
}
