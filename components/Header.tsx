'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useEffect, useLayoutEffect, useState } from 'react';
import { bagCount, useStore } from '@/lib/store';
import { WhenSignedIn } from './auth/AuthEnabled';
import { Handwriting } from './Handwriting';
import { BagIcon, MenuIcon, SearchIcon } from './icons';
import { MenuDrawer } from './MenuDrawer';
import styles from './Header.module.css';

type Props = {
  /**
   * id of the element the header floats over while transparent (a full-bleed hero).
   * Omit it for pages whose header is always solid white.
   */
  overlayTargetId?: string;
  /** Mobile: listing pages show a FILTER trigger where the logo sits (S2, approved). */
  mobileLeft?: 'logo' | 'filter';
  onFilter?: () => void;
};

// Runs before paint in the browser (so the name never flashes in full before it is written).
const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const NAME_WRITTEN = 'hok-name-written';

/**
 * Signed in: the visitor's first name in the house script, linking to their account
 * (EXTRAPOLATED, client request: the "Welcome back" script and red). It writes itself the
 * first time it appears in a visit, then simply shows. Without a first name: "Account".
 */
function AccountName() {
  const { user } = useUser();
  const name = user?.firstName?.trim() || user?.fullName?.trim().split(/\s+/)[0] || '';
  const [write, setWrite] = useState(false);

  useBrowserLayoutEffect(() => {
    if (!name) return;
    try {
      if (window.sessionStorage.getItem(NAME_WRITTEN)) return;
      window.sessionStorage.setItem(NAME_WRITTEN, '1');
      setWrite(true);
    } catch {
      // Storage blocked: the name is simply shown.
    }
  }, [name]);

  if (!name) {
    return (
      <Link href="/account" className={styles.navLink}>
        Account
      </Link>
    );
  }
  return (
    <Link
      href="/account"
      className={styles.name}
      aria-label={`Your account, ${name}`}
      data-write={write ? 'load' : undefined}
      // Names longer than 9 letters are written a little smaller (never below 70%) to keep the header's spacing.
      style={{ '--write-delay': '150ms', '--name-scale': Math.max(0.7, Math.min(1, 9 / name.length)) } as React.CSSProperties}
    >
      <Handwriting text={name} decorative />
    </Link>
  );
}

/**
 * Global header (spec §3.1). Sticky: transparent with white text while it overlaps
 * the hero (variant A), solid white with black text after it (variant B).
 * The switch is instant; no transition is evidenced.
 */
export function Header({ overlayTargetId, mobileLeft = 'logo', onFilter }: Props) {
  const [solid, setSolid] = useState(!overlayTargetId);
  const [menuOpen, setMenuOpen] = useState(false);
  const count = bagCount(useStore());

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
    <>
      {/* Named so it stays anchored while pages cross-fade beneath it (globals.css). */}
      <header
        data-chrome
        className={styles.header}
        data-variant={solid ? 'solid' : 'transparent'}
        style={{ viewTransitionName: 'site-header' }}
      >
        {/* Desktop: three zones */}
        <nav className={`${styles.zone} ${styles.left}`} aria-label="Primary">
          <button
            type="button"
            className={styles.navLink}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon className={styles.menuIcon} />
            Shop
          </button>
          <Link href="/new-arrivals" className={styles.navLink}>
            New Arrivals
          </Link>
          <Link href="/the-brand" className={styles.navLink}>
            The Brand
          </Link>
        </nav>

        <Link href="/" className={`${styles.logo} ${mobileLeft === 'filter' ? styles.logoDesktopOnly : ''}`}>
          House of Kanishka
        </Link>
        {mobileLeft === 'filter' && (
          <button type="button" className={styles.mobileFilter} onClick={onFilter}>
            Filter
          </button>
        )}

        <nav className={`${styles.zone} ${styles.right}`} aria-label="Account">
          <Link href="/search" className={styles.navLink}>
            Search
          </Link>
          <WhenSignedIn
            signedIn={<AccountName />}
            signedOut={
              <Link href="/login" className={styles.navLink}>
                Login
              </Link>
            }
          />
          <Link href="/bag" className={styles.navLink}>
            Shopping Bag{count > 0 && ` (${count})`}
          </Link>
        </nav>

        {/* Mobile: icons only */}
        <div className={styles.icons}>
          <Link href="/bag" className={styles.iconBtn} aria-label={count > 0 ? `Shopping bag, ${count} ${count === 1 ? 'item' : 'items'}` : 'Shopping bag, empty'}>
            <BagIcon size={24} />
            {count > 0 && <span className={styles.badge}>{count}</span>}
          </Link>
          <Link href="/search" className={styles.iconBtn} aria-label="Search">
            <SearchIcon size={22} />
          </Link>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Menu"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon size={24} />
          </button>
        </div>
      </header>
      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
