'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { AuthShell } from './AuthShell';
import styles from './AuthView.module.css';
import { Welcome, WELCOME_MS } from './Welcome';

/**
 * The welcome moment for sign-ins that leave the site and come back (Google): plays once on
 * arrival, then opens the page the customer was heading for.
 */
export function WelcomeThenGo({ next, kind }: { next: string; kind: 'back' | 'new' }) {
  const router = useRouter();
  const gone = useRef(false);
  const go = () => {
    if (gone.current) return;
    gone.current = true;
    router.replace(next);
  };

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return go();
    const id = window.setTimeout(go, WELCOME_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthShell welcoming>
      <div className={styles.welcomeOnly}>
        <Welcome kind={kind} onSkip={go} />
      </div>
    </AuthShell>
  );
}
