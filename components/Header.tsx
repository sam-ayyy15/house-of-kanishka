'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BagIcon, MenuIcon, SearchIcon } from './icons';
import styles from './Header.module.css';

type Props = {
  /**
   * id of the element the header floats over while transparent (the homepage hero).
   * Omit it for pages whose header is always solid white.
   */
  overlayTargetId?: string;
  bagCount?: number;
  /** Mobile: listing pages show a FILTER trigger where the logo sits (S2, approved). */
  mobileLeft?: 'logo' | 'filter';
};

/**
 * Global header (spec §3.1). Sticky: transparent with white text while it overlaps
 * the hero (variant A), solid white with black text after it (variant B).
 * The switch is instant; no transition is evidenced.
 */
export function Header({ overlayTargetId, bagCount = 0, mobileLeft = 'logo' }: Props) {
  const [solid, setSolid] = useState(!overlayTargetId);

  useEffect(() => {
    if (!overlayTargetId) return;
    const target = document.getElementById(overlayTargetId);
    if (!target) return;
    const headerH = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--header-h'),
    );
    // Solid as soon as the hero's bottom edge scrolls above the header's bottom edge.
    const observer = new IntersectionObserver(
      ([entry]) => setSolid(!entry.isIntersecting),
      { rootMargin: `-${headerH || 80}px 0px 0px 0px`, threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [overlayTargetId]);

  return (
    <header className={styles.header} data-variant={solid ? 'solid' : 'transparent'}>
      {/* Desktop: three zones */}
      <nav className={`${styles.zone} ${styles.left}`} aria-label="Primary">
        {/* Only one listing page exists so far, so Shop and New Arrivals both open it. */}
        <Link href="/dresses" className={styles.navLink}>
          <MenuIcon className={styles.menuIcon} />
          Shop
        </Link>
        <Link href="/dresses" className={styles.navLink}>
          New Arrivals
        </Link>
        <a href="#" className={styles.navLink}>
          The Brand
        </a>
      </nav>

      <Link href="/" className={`${styles.logo} ${mobileLeft === 'filter' ? styles.logoDesktopOnly : ''}`}>
        House of Kanishka
      </Link>
      {mobileLeft === 'filter' && (
        // What FILTER opens is [M]; the trigger is inert for now.
        <button type="button" className={styles.mobileFilter}>
          Filter
        </button>
      )}

      <nav className={`${styles.zone} ${styles.right}`} aria-label="Account">
        <a href="#" className={styles.navLink}>
          Search
        </a>
        <a href="#" className={styles.navLink}>
          Login
        </a>
        <a href="#" className={styles.navLink}>
          Shopping Bag ({bagCount})
        </a>
      </nav>

      {/* Mobile: icons only */}
      <div className={styles.icons}>
        <a href="#" className={styles.iconBtn} aria-label={`Shopping bag, ${bagCount} items`}>
          <BagIcon size={24} />
        </a>
        <a href="#" className={styles.iconBtn} aria-label="Search">
          <SearchIcon size={22} />
        </a>
        <button type="button" className={styles.iconBtn} aria-label="Menu">
          <MenuIcon size={24} />
        </button>
      </div>
    </header>
  );
}
