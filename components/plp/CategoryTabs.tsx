import Link from 'next/link';
import styles from './CategoryTabs.module.css';

// Sub-category routes don't exist yet ([M]); only "View all" is the current page.
const tabs = ['View all', 'Midi | Maxi', 'Jumpsuits', 'Satin', 'Party'];

/**
 * PLP sub-categories (spec §5.1): active in black, the rest muted.
 * Built as navigation links (each is a category page) rather than ARIA tabs.
 * Mobile: one horizontally scrolling row (spec §12.4 #7).
 */
export function CategoryTabs() {
  return (
    <nav aria-label="Dress categories" className={styles.nav}>
      <ul className={styles.list}>
        {tabs.map((t, i) => (
          <li key={t}>
            <Link href={i === 0 ? '/dresses' : '#'} className={styles.tab} aria-current={i === 0 ? 'page' : undefined}>
              {t}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
