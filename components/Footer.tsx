import Link from 'next/link';
import { collections, collectionHref } from '@/lib/collections';
import { Emblem } from './Emblem';
import styles from './Footer.module.css';

const columns = [
  {
    title: 'Shop',
    links: [
      { label: 'New Arrivals', href: '/new-arrivals' },
      { label: 'Dresses', href: '/dresses' },
      { label: 'Accessories', href: '/accessories' },
    ],
  },
  {
    title: 'Collections',
    links: collections.map((c) => ({ label: c.title.join(' '), href: collectionHref(c.slug) })),
  },
  {
    title: 'Help',
    links: [
      { label: 'Shipping', href: '/help#shipping' },
      { label: 'Returns', href: '/help#returns' },
      { label: 'Size Guide', href: '/help#size-guide' },
      { label: 'Contact Us', href: '/help#support' },
    ],
  },
  {
    title: 'House',
    links: [
      { label: 'The Brand', href: '/the-brand' },
      { label: 'Account', href: '/account' },
      { label: 'Wishlist', href: '/wishlist' },
      { label: 'Shopping Bag', href: '/bag' },
    ],
  },
];

/** Global footer. EXTRAPOLATED – no reference design: built from the header and link styles. */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <Link href="/" className={styles.logo}>
          <Emblem className={styles.emblem} />
          House of Kanishka
        </Link>
        <nav className={styles.columns} aria-label="Footer">
          {columns.map((col, i) => (
            <div key={col.title} data-reveal="rise" style={{ '--reveal-delay': `${i * 80}ms` } as React.CSSProperties}>
              <h2 className={styles.heading}>{col.title}</h2>
              <ul className={styles.list}>
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className={styles.link}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className={styles.bottom}>
        <p>© {new Date().getFullYear()} House of Kanishka</p>
        <p>Prices in EUR</p>
      </div>
    </footer>
  );
}
