import { AccountNav } from '@/components/account/AccountNav';
import shell from '@/components/account/Account.module.css';
import { AdminDoors } from '@/components/admin/AdminDoors';
import { LockAdmin } from '@/components/admin/LockAdmin';
import styles from '@/components/admin/Admin.module.css';
import { Header } from '@/components/Header';
import { requireAdmin } from '@/lib/admin-gate';

const SECTIONS = [
  { href: '/admin', label: 'Today' },
  { href: '/admin/sales', label: 'Sales' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/stock', label: 'Stock' },
  { href: '/admin/messages', label: 'Messages' },
  { href: '/admin/settings', label: 'Settings' },
];

/** The admin sections: the founder, with the admin password entered (/admin/unlock). */
export default async function AdminAreaLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <>
      <Header />
      <main className="page">
        <div className={shell.shell}>
          <AccountNav sections={SECTIONS} label="Admin sections" extra={<LockAdmin />} />
          <div className={styles.admin}>{children}</div>
        </div>
      </main>
      {/* Right after the password: the red doors part once to reveal the admin area. */}
      <AdminDoors mode="arrive" />
    </>
  );
}
