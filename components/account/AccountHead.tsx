import { Eyebrow } from '../Eyebrow';
import styles from './Account.module.css';

/** Eyebrow, serif title and an optional line of introduction, rising in one after another. */
export function AccountHead({ title, children }: { title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className={styles.head}>
      <Eyebrow>Account</Eyebrow>
      <h1 className="page-title">{title}</h1>
      {children && <p className={styles.lede}>{children}</p>}
    </header>
  );
}
