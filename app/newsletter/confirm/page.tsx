import type { Metadata } from 'next';
import Link from 'next/link';
import { Emblem } from '@/components/Emblem';
import { Handwriting } from '@/components/Handwriting';
import { Header } from '@/components/Header';
import { syncBrevoContact } from '@/lib/brevo';
import { adminDb } from '@/lib/supabase/server';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Newsletter · House of Kanishka',
  robots: { index: false, follow: false },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Marks the address as confirmed (or unsubscribed); false when the link is not valid. */
async function apply(token: string, leave: boolean): Promise<boolean> {
  if (!UUID.test(token)) return false;
  const change = leave
    ? { status: 'unsubscribed', unsubscribed_at: new Date().toISOString() }
    : { status: 'confirmed', confirmed_at: new Date().toISOString(), unsubscribed_at: null };
  const { data, error } = await adminDb().from('newsletter_subscribers').update(change).eq('token', token).select('email');
  if (error || !data?.length) return false;
  await adminDb()
    .from('consent_log')
    .insert({ email: data[0].email, kind: 'newsletter', granted: !leave, source: leave ? 'unsubscribe-link' : 'confirm-link' });
  await syncBrevoContact(data[0].email, !leave);
  return true;
}

/**
 * The page behind the links in newsletter emails: ?token=… confirms the address, and
 * ?token=…&leave=1 unsubscribes it. EXTRAPOLATED – no reference design: the lotus, a line of
 * script and a serif sentence, as in the newsletter thank-you.
 */
export default async function NewsletterConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string; leave?: string }> }) {
  const { token = '', leave } = await searchParams;
  const leaving = leave === '1';
  const ok = await apply(token, leaving);

  return (
    <>
      <Header />
      <main className={styles.main}>
        <Emblem bloom="load" className={styles.emblem} />
        {ok && !leaving && (
          <p className={styles.script} data-write="load" style={{ '--write-delay': '700ms' } as React.CSSProperties}>
            <Handwriting text="Welcome" />
          </p>
        )}
        <h1 className={styles.title}>
          {!ok ? 'This link is no longer valid' : leaving ? 'You have been unsubscribed' : 'Your place on our list is confirmed'}
        </h1>
        <p className={styles.lede}>
          {!ok
            ? 'It may have been used already. You can join the list again from the home page.'
            : leaving
              ? 'We will not write to you again. You are welcome back at any time.'
              : 'You will be the first to discover new collections and exclusive offers.'}
        </p>
        <Link href="/new-arrivals" className="btn btn-black">
          Shop new arrivals
        </Link>
      </main>
    </>
  );
}
