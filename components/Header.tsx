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
};

/**
 * Global header (spec §3.1). Sticky: transparent with white text while it overlaps
 * the hero (variant A), solid white with black text after it (variant B).
 * The switch is instant; no transition is evidenced.
 */
export function Header({ overlayTargetId, bagCount = 0 }: Props) {
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
        <a href="#" className={styles.navLink}>
          <MenuIcon className={styles.menuIcon} />
          Shop
        </a>
        <a href="#" className={styles.navLink}>
          New Arrivals
        </a>
        <a href="#" className={styles.navLink}>
          The Brand
        </a>
      </nav>

      <Link href="/" className={styles.logo}>
        Vivienne Rôse
      </Link>

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
          <BagIcon />
        </a>
        <a href="#" className={styles.iconBtn} aria-label="Search">
          <SearchIcon />
        </a>
        <button type="button" className={styles.iconBtn} aria-label="Menu">
          <MenuIcon size={20} />
        </button>
      </div>
    </header>
  );
}
