'use client';

import { useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import styles from './Account.module.css';

const SECTIONS = [
  { href: '/account', label: 'Overview' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/addresses', label: 'Addresses' },
  { href: '/account/wishlist', label: 'Wishlist' },
  { href: '/account/preferences', label: 'Preferences' },
  { href: '/account/settings', label: 'Settings' },
];

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Account section links: a serif column on desktop, a scrollable row of tabs on smaller
 * screens. A red hairline slides to the current section (down the column's left edge, or
 * along the tabs' bottom edge).
 */
export function AccountNav({
  sections = SECTIONS,
  label = 'Account sections',
  extra,
}: {
  sections?: { href: string; label: string }[];
  label?: string;
  /** Shown under "Sign out" (the admin area's "Lock admin"). */
  extra?: React.ReactNode;
}) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const list = useRef<HTMLUListElement>(null);
  const [marker, setMarker] = useState<{ transform: string; ready: boolean } | null>(null);

  // The longest matching link wins, so the root link is only current on the root page.
  const current =
    sections.filter((s) => pathname === s.href || pathname.startsWith(`${s.href}/`)).sort((a, b) => b.href.length - a.href.length)[0]?.href ?? sections[0].href;

  useIsoLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    const place = () => {
      const link = el.querySelector<HTMLElement>('[aria-current="page"]');
      if (!link) return;
      const column = getComputedStyle(el).flexDirection === 'column';
      const transform = column
        ? `translateY(${link.offsetTop}px) scaleY(${link.offsetHeight})`
        : `translateX(${link.offsetLeft}px) scaleX(${link.offsetWidth})`;
      // The first placement appears in place; later ones slide.
      setMarker((m) => ({ transform, ready: m !== null }));
      if (!column) {
        const target = link.offsetLeft - (el.clientWidth - link.offsetWidth) / 2;
        el.scrollTo({ left: target, behavior: 'smooth' });
      }
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(el);
    return () => observer.disconnect();
  }, [current]);

  // Switch the slide on one frame after the first placement.
  useEffect(() => {
    if (marker && !marker.ready) {
      const id = requestAnimationFrame(() => setMarker((m) => (m ? { ...m, ready: true } : m)));
      return () => cancelAnimationFrame(id);
    }
  }, [marker]);

  return (
    <nav className={styles.nav} aria-label={label}>
      <ul ref={list} className={styles.list}>
        {sections.map((s) => (
          <li key={s.href}>
            <Link href={s.href} className={styles.link} aria-current={s.href === current ? 'page' : undefined}>
              {s.label}
            </Link>
          </li>
        ))}
        <li aria-hidden="true">
          <span className={styles.marker} data-ready={marker?.ready ? '' : undefined} style={marker ? { transform: marker.transform } : undefined} />
        </li>
      </ul>
      <button type="button" className={`text-link ${styles.signOut}`} onClick={() => signOut({ redirectUrl: '/' })}>
        Sign out
      </button>
      {extra}
    </nav>
  );
}
