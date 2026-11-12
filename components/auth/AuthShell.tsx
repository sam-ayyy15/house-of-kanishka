import Image from 'next/image';
import styles from './AuthView.module.css';

/** The login page's split layout: portrait with the red script on the left, content on the right. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.split}>
      <div className={styles.visual}>
        <div className={styles.photo}>
          {/* Placeholder: local-only photo. Never ship. */}
          <Image src="/placeholders/who-we-are.jpg" alt="" fill priority sizes="(max-width: 1023px) 0px, 50vw" />
        </div>
        <p className={styles.script} aria-hidden="true">
          <span>Welcome</span>
          <span className={styles.scriptLine2}>to the house</span>
        </p>
      </div>
      <div className={styles.panel}>
        <div className={styles.inner}>{children}</div>
      </div>
    </div>
  );
}
