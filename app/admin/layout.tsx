import type { Metadata } from 'next';
import { requireFounder } from '@/lib/founder';

export const metadata: Metadata = {
  title: 'Admin · House of Kanishka',
  robots: { index: false, follow: false, nocache: true },
};

// Always decided per request: who is asking must be checked every time, never cached.
export const dynamic = 'force-dynamic';

/**
 * The founder's admin area. Not linked from anywhere, never indexed, and to anyone but the
 * founder (FOUNDER_CLERK_USER_ID) every page here is a plain "not found". Inside, the
 * sections ((area)/) also need the admin password (lib/admin-gate.ts, /admin/unlock).
 */
export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  await requireFounder();
  return children;
}
