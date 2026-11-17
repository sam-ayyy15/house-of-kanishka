import Link from 'next/link';
import { getCatalog } from '@/lib/catalog';
import { collectionHref } from '@/lib/collections';
import { CookiePreferencesLink } from './CookiePreferencesLink';
import { Emblem } from './Emblem';
import styles from './Footer.module.css';

const columns = (collections: { slug: string; title: string[] }[]) => [
  {
    title: 'Shop',
    links: [
      { label: 'New Arrivals', href: '/new-arrivals' },
      { label: 'Dresses', href: '/dresses' },
      { label: 'Accessories', href: '/accessories' },
      { label: 'Lookbook', href: '/lookbook' },
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
      { label: 'Track Order', href: '/track' },
      { label: 'Contact Us', href: '/contact' },
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

const LEGAL = [
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Refunds', href: '/refund-policy' },
  { label: 'Shipping', href: '/shipping-policy' },
];

/** Global footer. EXTRAPOLATED – no reference design: built from the header and link styles. */
export async function Footer() {
  const { collections } = await getCatalog();
  return (
    <footer data-chrome className={styles.footer}>
      <div className={styles.top}>
        <Link href="/" className={styles.logo}>
          <Emblem className={styles.emblem} />
          House of Kanishka
        </Link>
        <nav className={styles.columns} aria-label="Footer">
          {columns(collections).map((col, i) => (
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
        <p>
          {/* The registered-trademark sign gets its own, larger size: in the 12px line the font's
              built-in ® is a speck. It stays a real character, so it is still read as "registered". */}
          <span className={styles.mark}>®</span> {new Date().getFullYear()} House of Kanishka
        </p>
        <p>
          {LEGAL.map((l) => (
            <span key={l.href}>
              <Link href={l.href} className={styles.bottomLink}>
                {l.label}
              </Link>{' '}
              ·{' '}
            </span>
          ))}
          Prices in INR · <CookiePreferencesLink className={styles.bottomLink} />
        </p>
      </div>
    </footer>
  );
}
