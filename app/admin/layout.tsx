import type { Metadata } from 'next';
import { AccountNav } from '@/components/account/AccountNav';
import shell from '@/components/account/Account.module.css';
import styles from '@/components/admin/Admin.module.css';
import { Header } from '@/components/Header';
import { requireFounder } from '@/lib/founder';

export const metadata: Metadata = {
  title: 'Admin · House of Kanishka',
  robots: { index: false, follow: false, nocache: true },
};

// Always decided per request: who is asking must be checked every time, never cached.
export const dynamic = 'force-dynamic';

const SECTIONS = [
  { href: '/admin', label: 'Today' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/stock', label: 'Stock' },
  { href: '/admin/messages', label: 'Messages' },
  { href: '/admin/settings', label: 'Settings' },
];

/**
 * The founder's admin area. Not linked from anywhere, never indexed, and to anyone but the
 * founder (FOUNDER_CLERK_USER_ID) every page here is a plain "not found".
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireFounder();
  return (
    <>
      <Header />
      <main className="page">
        <div className={shell.shell}>
          <AccountNav sections={SECTIONS} label="Admin sections" />
          <div className={styles.admin}>{children}</div>
        </div>
      </main>
    </>
  );
}
