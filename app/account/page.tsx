import Link from 'next/link';
import styles from '@/components/account/Account.module.css';
import { Eyebrow } from '@/components/Eyebrow';
import { Handwriting } from '@/components/Handwriting';
import { ensureProfile, requireUserId } from '@/lib/customer';
import { formatPrice } from '@/lib/format';
import { isNewAccount } from '@/lib/new-account';
import { orderDate, orderStatusLabel } from '@/lib/order-status';
import { orderUrl } from '@/lib/orders';
import { adminDb } from '@/lib/supabase/server';

const delay = (ms: number) => ({ '--reveal-delay': `${ms}ms` }) as React.CSSProperties;

/**
 * Account overview: a handwritten welcome, the latest order, the default address, the
 * wishlist and the newsletter choice, each linking to its own section.
 */
export default async function AccountOverviewPage() {
  const userId = await requireUserId('/account');
  const profile = await ensureProfile(userId);
  const db = adminDb();
  const [address, wishlist, latest] = await Promise.all([
    db.from('addresses').select('full_name, line1, line2, city, state, pincode').eq('clerk_user_id', userId).eq('is_default', true).maybeSingle(),
    db.from('wishlist_items').select('product_id', { count: 'exact', head: true }).eq('clerk_user_id', userId),
    db.from('orders').select('number, access_token, status, total_inr, placed_at').eq('clerk_user_id', userId).order('placed_at', { ascending: false }).limit(1).maybeSingle(),
  ]);
  const order = latest.data;
  const isNew = isNewAccount(profile.created_at);
  // New, with a name: "Welcome to the house" over the name. New, without one: "Welcome" over
  // "to the house" (the title), so the phrase is never written twice.
  const welcomeToHouse = isNew && !!profile.first_name;
  const saved = wishlist.count ?? 0;
  const a = address.data;

  return (
    <>
      <header className={styles.head}>
        <Eyebrow>Account</Eyebrow>
        {/* A new account (lib/new-account.ts) is welcomed to the house; everyone else is welcomed back. */}
        <p className={`${styles.script} ${welcomeToHouse ? styles.scriptWrap : ''}`} data-write="load" style={{ '--write-delay': '300ms' } as React.CSSProperties}>
          {welcomeToHouse ? (
            <>
              <span className="visually-hidden">Welcome to the house</span>
              <span aria-hidden="true" className={styles.scriptPart}>
                <Handwriting text="Welcome" decorative />
              </span>{' '}
              <span aria-hidden="true" className={styles.scriptPart}>
                <Handwriting text="to the house" from={8} decorative />
              </span>
            </>
          ) : (
            <Handwriting text={isNew ? 'Welcome' : 'Welcome back'} />
          )}
        </p>
        <h1 className="page-title">{profile.first_name ? <em>{profile.first_name}</em> : 'to the house'}</h1>
      </header>

      <section className={styles.row} aria-labelledby="ov-order">
        <h2 id="ov-order" className={styles.rowTitle} data-reveal="rise">
          <span className={styles.index}>(01)</span>Latest order
        </h2>
        <div className={styles.body} data-reveal="rise" style={delay(80)}>
          {order ? (
            <>
              <p className={styles.serif}>
                {order.number} · {orderStatusLabel(order.status)}
              </p>
              <p className="muted">
                Placed on {orderDate(order.placed_at)} · {formatPrice(order.total_inr)}
              </p>
              <Link href={orderUrl(order)} className="btn btn-black">
                View order
              </Link>
              <Link href="/account/orders" className="text-link">
                All orders
              </Link>
            </>
          ) : (
            <>
              <p className={styles.serif}>You have not placed an order yet.</p>
              <p className="muted">When you do, it will appear here with each step of its journey to you.</p>
              <Link href="/new-arrivals" className="btn btn-black">
                Shop new arrivals
              </Link>
            </>
          )}
        </div>
      </section>

      <section className={styles.row} aria-labelledby="ov-address">
        <h2 id="ov-address" className={styles.rowTitle} data-reveal="rise">
          <span className={styles.index}>(02)</span>Delivery address
        </h2>
        <div className={styles.body} data-reveal="rise" style={delay(80)}>
          {a ? (
            <p>
              {a.full_name}
              <br />
              {a.line1}
              {a.line2 ? `, ${a.line2}` : ''}
              <br />
              {a.city}, {a.state} {a.pincode}
            </p>
          ) : (
            <p className="muted">No address saved yet. Save one now and checkout takes a moment.</p>
          )}
          <Link href="/account/addresses" className="text-link">
            {a ? 'Manage addresses' : 'Add an address'}
          </Link>
        </div>
      </section>

      <section className={styles.row} aria-labelledby="ov-wishlist">
        <h2 id="ov-wishlist" className={styles.rowTitle} data-reveal="rise">
          <span className={styles.index}>(03)</span>Wishlist
        </h2>
        <div className={styles.body} data-reveal="rise" style={delay(80)}>
          <p>{saved === 0 ? 'Nothing saved yet. Tap the heart on any piece to keep it.' : `${saved} ${saved === 1 ? 'piece' : 'pieces'} saved.`}</p>
          <Link href="/account/wishlist" className="text-link">
            View wishlist
          </Link>
        </div>
      </section>

      <section className={styles.row} aria-labelledby="ov-letters">
        <h2 id="ov-letters" className={styles.rowTitle} data-reveal="rise">
          <span className={styles.index}>(04)</span>Letters from the house
        </h2>
        <div className={styles.body} data-reveal="rise" style={delay(80)}>
          <p>
            {profile.marketing_opt_in
              ? 'You are on our list, and will be the first to discover new collections.'
              : 'You are not on our list. Join to be the first to discover new collections.'}
          </p>
          <Link href="/account/preferences" className="text-link">
            Preferences
          </Link>
        </div>
      </section>
    </>
  );
}
