import styles from '@/components/admin/Admin.module.css';
import { MessageActions } from '@/components/admin/MessageActions';
import { requireFounder } from '@/lib/founder';
import { orderDate } from '@/lib/order-status';
import { adminDb } from '@/lib/supabase/server';

/** Contact-form messages, newest first, and how many people are on the lists. */
export default async function AdminMessagesPage() {
  await requireFounder();
  const db = adminDb();
  const [messages, confirmed, pending, waitlist] = await Promise.all([
    db.from('contact_messages').select('id, name, email, order_number, message, status, created_at').order('created_at', { ascending: false }).limit(100),
    db.from('newsletter_subscribers').select('id', { count: 'exact', head: true }).eq('status', 'confirmed'),
    db.from('newsletter_subscribers').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('launch_waitlist').select('category_slug'),
  ]);
  const waiting = new Map<string, number>();
  for (const w of waitlist.data ?? []) waiting.set(w.category_slug, (waiting.get(w.category_slug) ?? 0) + 1);

  return (
    <>
      <header className={styles.head}>
        <h1 className={styles.title}>Messages</h1>
        <p className={styles.sub}>
          Newsletter: {confirmed.count ?? 0} confirmed, {pending.count ?? 0} not yet confirmed
          {[...waiting].map(([slug, n]) => ` · ${n} waiting for ${slug}`).join('')}
        </p>
      </header>
      {messages.data?.length ? (
        messages.data.map((m, i) => (
          <article key={m.id} className={styles.message} style={{ '--i': Math.min(i, 12) } as React.CSSProperties}>
            <div>
              <p className={styles.productName}>{m.name}</p>
              <p>
                <a href={`mailto:${m.email}`}>{m.email}</a>
              </p>
              <p className={styles.muted}>
                {orderDate(m.created_at)}
                {m.order_number ? ` · order ${m.order_number}` : ''}
              </p>
            </div>
            <p className={styles.messageText}>{m.message}</p>
            <MessageActions id={m.id} status={m.status} email={m.email} />
          </article>
        ))
      ) : (
        <p className={styles.empty}>No messages yet.</p>
      )}
    </>
  );
}
