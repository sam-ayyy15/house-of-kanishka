'use client';

import { useEffect, useState } from 'react';
import styles from './PolicyPage.module.css';

/**
 * The contents list of a policy page: stays under the header while reading, and a red
 * hairline marks the section currently on screen (it slides between items with transform).
 */
export function PolicyNav({ items }: { items: { id: string; label: string }[] }) {
  const [current, setCurrent] = useState(items[0]?.id);

  useEffect(() => {
    const sections = items.map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => !!el);
    // The section crossing a line a third of the way down the screen is the current one.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setCurrent(e.target.id);
      },
      { rootMargin: '-30% 0px -65% 0px' },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className={styles.nav} aria-label="On this page">
      <ul className={styles.navList}>
        {items.map((item, i) => (
          <li key={item.id} style={{ '--i': i } as React.CSSProperties}>
            <a href={`#${item.id}`} className={styles.navLink} aria-current={current === item.id ? 'true' : undefined}>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
