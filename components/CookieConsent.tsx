'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { closeCookiePreferences, saveConsent, useConsent } from '@/lib/consent';
import styles from './CookieConsent.module.css';

/**
 * Cookie notice. EXTRAPOLATED – no reference design. A quiet panel at the foot of the screen
 * (it never blocks the page): accept all, essential only, or choose. It stays away once a
 * choice is saved, and the footer's "Cookie preferences" brings it back.
 */
export function CookieConsent() {
  const { ready, consent, prefsOpen } = useConsent();
  const visible = ready && (consent === null || prefsOpen);
  const id = useId();
  const [manage, setManage] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const panel = useRef<HTMLElement>(null);

  // Reopened from the footer: start from the saved choice and take focus.
  useEffect(() => {
    if (!prefsOpen) return;
    setAnalytics(consent?.analytics ?? false);
    setMarketing(consent?.marketing ?? false);
    setManage(true);
    panel.current?.focus();
  }, [prefsOpen, consent]);

  if (!visible) return null;

  return (
    <section
      ref={panel}
      tabIndex={-1}
      className={styles.panel}
      data-manage={manage || undefined}
      role="dialog"
      aria-modal="false"
      aria-labelledby={`${id}-title`}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && prefsOpen) closeCookiePreferences();
      }}
    >
      <h2 id={`${id}-title`} className={styles.title}>
        Cookies
      </h2>
      <p className={styles.text}>
        We use essential cookies to run the shop: your bag and signing in. With your consent we would also use analytics and
        marketing cookies, to see what works and to show you things you may like. Your choice is kept on this device.
      </p>

      {manage && (
        <ul className={styles.options}>
          <li>
            <label className={styles.option}>
              <input type="checkbox" checked disabled />
              <span>
                <strong>Essential</strong>
                Needed for the shop to work. Always on.
              </span>
            </label>
          </li>
          <li>
            <label className={styles.option}>
              <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
              <span>
                <strong>Analytics</strong>
                Counts visits and shows which pages are used.
              </span>
            </label>
          </li>
          <li>
            <label className={styles.option}>
              <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
              <span>
                <strong>Marketing</strong>
                Lets us measure campaigns and show relevant offers.
              </span>
            </label>
          </li>
        </ul>
      )}

      <div className={styles.actions}>
        {manage ? (
          <button type="button" className="btn btn-black" onClick={() => saveConsent(analytics, marketing)}>
            Save choices
          </button>
        ) : (
          <button type="button" className="btn btn-black" onClick={() => saveConsent(true, true)}>
            Accept all
          </button>
        )}
        <button type="button" className="btn btn-outline" onClick={() => saveConsent(false, false)}>
          Essential only
        </button>
        {!manage && (
          <button type="button" className={`text-link ${styles.manage}`} onClick={() => setManage(true)}>
            Manage
          </button>
        )}
        {prefsOpen && (
          <button type="button" className={`text-link ${styles.manage}`} onClick={closeCookiePreferences}>
            Close
          </button>
        )}
      </div>
    </section>
  );
}
