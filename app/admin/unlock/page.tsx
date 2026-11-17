import { redirect } from 'next/navigation';
import { AdminGate } from '@/components/admin/AdminGate';
import { Header } from '@/components/Header';
import { adminPasswordConfigured, founderUnlocked } from '@/lib/admin-gate';

/** Where to go after unlocking: an admin page only (never this page, never off-site). */
function safeAdminNext(next: string | undefined): string {
  if (typeof next === 'string' && /^\/admin(\/[A-Za-z0-9%_-]+)*\/?$/.test(next) && !next.startsWith('/admin/unlock')) return next;
  return '/admin';
}

/**
 * The admin area's door: the admin password, asked of the founder (the parent layout has
 * already shown "not found" to everyone else) before any admin page opens.
 */
export default async function AdminUnlockPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const after = safeAdminNext(next);
  if (await founderUnlocked()) redirect(after);
  return (
    <>
      <Header />
      <main>
        <AdminGate next={after} configured={adminPasswordConfigured()} />
      </main>
    </>
  );
}
