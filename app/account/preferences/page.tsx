import { AccountHead } from '@/components/account/AccountHead';
import styles from '@/components/account/Account.module.css';
import { PreferencesForm } from '@/components/account/PreferencesForm';
import { CookiePreferencesLink } from '@/components/CookiePreferencesLink';
import { ensureProfile, requireUserId } from '@/lib/customer';

export default async function AccountPreferencesPage() {
  const userId = await requireUserId('/account/preferences');
  const profile = await ensureProfile(userId);
  return (
    <>
      <AccountHead title="Preferences">What you hear from us, and what this site may remember.</AccountHead>

      <section className={styles.row} aria-labelledby="pref-letters">
        <h2 id="pref-letters" className={styles.rowTitle}>
          <span className={styles.index}>(01)</span>Letters from the house
        </h2>
        <div className={styles.body}>
          <PreferencesForm subscribed={profile.marketing_opt_in} email={profile.email} />
        </div>
      </section>

      <section className={styles.row} aria-labelledby="pref-cookies">
        <h2 id="pref-cookies" className={styles.rowTitle}>
          <span className={styles.index}>(02)</span>Cookies
        </h2>
        <div className={styles.body}>
          <p>Choose whether this browser may keep analytics cookies. Essential cookies keep you signed in and remember your bag.</p>
          <CookiePreferencesLink className="text-link" />
        </div>
      </section>
    </>
  );
}
