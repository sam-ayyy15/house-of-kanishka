import styles from '@/components/admin/Admin.module.css';
import { LaunchSwitch, SettingsForm } from '@/components/admin/SettingsForms';
import { getCatalog } from '@/lib/catalog';
import { emailConfigured } from '@/lib/email';
import { requireAdmin } from '@/lib/admin-gate';
import { razorpayConfigured } from '@/lib/razorpay';
import { adminDb } from '@/lib/supabase/server';

export default async function AdminSettingsPage() {
  await requireAdmin('/admin/settings');
  const [{ settings }, categories] = await Promise.all([getCatalog(), adminDb().from('categories').select('slug, launch_state').order('slug')]);
  const services: [string, boolean, string][] = [
    ['Online payment (Razorpay)', razorpayConfigured, 'RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET'],
    ['Payment webhook', !!process.env.RAZORPAY_WEBHOOK_SECRET, 'RAZORPAY_WEBHOOK_SECRET'],
    ['Emails (Resend)', emailConfigured, 'RESEND_API_KEY, EMAIL_FROM'],
    ['Account webhook (Clerk)', !!process.env.CLERK_WEBHOOK_SIGNING_SECRET, 'CLERK_WEBHOOK_SIGNING_SECRET'],
    ['Newsletter list (Brevo)', !!process.env.BREVO_API_KEY && !!process.env.BREVO_LIST_ID, 'BREVO_API_KEY, BREVO_LIST_ID'],
  ];

  return (
    <>
      <header className={styles.head}>
        <h1 className={styles.title}>Settings</h1>
      </header>

      <section className={styles.row}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.index}>(01)</span>Shipping and cash on delivery
        </h2>
        <div className={styles.rowBody}>
          <SettingsForm
            freeFrom={settings.freeShippingThreshold}
            fee={settings.shippingFee}
            codEnabled={settings.codEnabled}
            codMax={settings.codMaxOrder}
          />
        </div>
      </section>

      <section className={styles.row}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.index}>(02)</span>Launch switch
        </h2>
        <div className={styles.rowBody}>
          <p>A category that is “coming soon” shows its teaser and “Notify me” form; its pieces cannot be opened, searched for or bought.</p>
          {(categories.data ?? []).map((c) => (
            <LaunchSwitch key={c.slug} slug={c.slug} live={c.launch_state === 'live'} />
          ))}
        </div>
      </section>

      <section className={styles.row}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.index}>(03)</span>Connected services
        </h2>
        <div className={styles.rowBody}>
          {services.map(([name, on, keys]) => (
            <div key={name} className={styles.switch}>
              <span>
                {name}
                {!on && (
                  <>
                    <br />
                    <span className={styles.muted}>Needs {keys} in the site’s environment settings.</span>
                  </>
                )}
              </span>
              <span className={styles.tag} data-tone={on ? 'black' : 'red'}>
                {on ? 'On' : 'Not set up'}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
