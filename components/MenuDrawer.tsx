'use client';

import Link from 'next/link';
import { collections, collectionHref } from '@/lib/collections';
import { Drawer } from './Drawer';
import styles from './MenuDrawer.module.css';

const shop = [
  { label: 'New Arrivals', href: '/new-arrivals' },
  { label: 'Dresses', href: '/dresses' },
  { label: 'Accessories', href: '/accessories' },
  { label: 'Lookbook', href: '/lookbook' },
  { label: 'The Brand', href: '/the-brand' },
];

const utility = [
  { label: 'Search', href: '/search' },
  { label: 'Account', href: '/account' },
  { label: 'Wishlist', href: '/wishlist' },
  { label: 'Shopping Bag', href: '/bag' },
  { label: 'Help', href: '/help' },
  { label: 'Contact Us', href: '/help#support' },
];

/** Menu opened by the ≡ trigger. EXTRAPOLATED – no reference design. */
export function MenuDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Drawer open={open} onClose={onClose} side="left" label="Menu">
      <nav aria-label="Menu" className={styles.nav}>
        <ul className={styles.primary}>
          {shop.map((l, i) => (
            <li key={l.href} style={{ '--i': i } as React.CSSProperties}>
              <Link href={l.href} onClick={onClose} className={styles.primaryLink}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <p className={styles.heading}>Collections</p>
        <ul className={styles.secondary}>
          {collections.map((c, i) => (
            <li key={c.slug} style={{ '--i': shop.length + 1 + i } as React.CSSProperties}>
              <Link href={collectionHref(c.slug)} onClick={onClose} className={styles.secondaryLink}>
                {c.title.join(' ')}
              </Link>
            </li>
          ))}
        </ul>

        <ul className={styles.utility}>
          {utility.map((l, i) => (
            <li key={l.href} style={{ '--i': shop.length + collections.length + 2 + i * 0.5 } as React.CSSProperties}>
              <Link href={l.href} onClick={onClose} className={styles.utilityLink}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Drawer>
  );
}
