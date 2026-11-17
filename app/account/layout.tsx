import type { Metadata } from 'next';
import { AccountNav } from '@/components/account/AccountNav';
import styles from '@/components/account/Account.module.css';
import { Header } from '@/components/Header';
import { requireUserId } from '@/lib/customer';

export const metadata: Metadata = {
  title: 'Account · House of Kanishka',
  robots: { index: false, follow: false },
};

/**
 * The account area: section links beside (or above) the current section. Every page under
 * /account also checks sign-in itself, so it stays protected even if the proxy's path
 * matching ever misses it.
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requireUserId('/account');
  return (
    <>
      <Header />
      <main className="page">
        <div className={styles.shell}>
          <AccountNav />
          <div>{children}</div>
        </div>
      </main>
    </>
  );
}
