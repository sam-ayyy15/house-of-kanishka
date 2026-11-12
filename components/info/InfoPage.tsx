import Link from 'next/link';
import { Header } from '../Header';
import styles from './InfoPage.module.css';

const pages = [
  { label: 'Shipping & Returns', href: '/shipping-returns' },
  { label: 'Size Guide', href: '/size-guide' },
  { label: 'Contact Us', href: '/contact' },
];

/** Shell for customer-care pages. EXTRAPOLATED – no reference design. */
export function InfoPage({ title, current, children }: { title: string; current: string; children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className={`page ${styles.layout}`}>
        <nav aria-label="Customer care" className={styles.nav}>
          {pages.map((p) => (
            <Link key={p.href} href={p.href} className={styles.navLink} aria-current={p.href === current ? 'page' : undefined}>
              {p.label}
            </Link>
          ))}
        </nav>
        <div className={styles.body}>
          <h1 className="page-title">{title}</h1>
          <div className={styles.prose}>{children}</div>
        </div>
      </main>
    </>
  );
}
