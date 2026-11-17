import styles from '@/components/admin/Admin.module.css';
import { requireFounder } from '@/lib/founder';
import { adminDb } from '@/lib/supabase/server';

const when = (iso: string) =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date(iso));

/** Server errors from the last 30 days (recorded by instrumentation.ts), newest first. */
export default async function AdminErrorsPage() {
  await requireFounder();
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { data } = await adminDb().from('error_log').select('id, path, message, digest, kind, created_at').gte('created_at', since).order('created_at', { ascending: false }).limit(200);
  const rows = data ?? [];
  return (
    <>
      <header className={styles.head}>
        <h1 className={styles.title}>Errors</h1>
        <p className={styles.sub}>What went wrong on the server in the last 30 days. Share a line from here when asking for a fix.</p>
      </header>
      {rows.length === 0 ? (
        <p className={styles.empty}>Nothing has gone wrong.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>When</th>
                <th className={styles.th}>Where</th>
                <th className={styles.th}>What</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e, i) => (
                <tr key={e.id} style={{ '--i': Math.min(i, 12) } as React.CSSProperties}>
                  <td style={{ whiteSpace: 'nowrap' }}>{when(e.created_at)}</td>
                  <td>
                    {e.path}
                    <br />
                    <span className={styles.muted}>{e.kind}</span>
                  </td>
                  <td style={{ overflowWrap: 'anywhere' }}>
                    {e.message}
                    {e.digest && (
                      <>
                        <br />
                        <span className={styles.muted}>code {e.digest}</span>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
