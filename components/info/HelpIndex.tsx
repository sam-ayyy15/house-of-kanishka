'use client';

import { useEffect, useState } from 'react';
import styles from './HelpIndex.module.css';

type Topic = { id: string; n: string; label: string };

/**
 * (01) Shipping (02) Returns … the numbered index from the Accessories section, as anchor
 * links. The topic currently on screen is marked, so the list doubles as "you are here".
 */
export function HelpIndex({ topics }: { topics: Topic[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sections = topics.map((t) => document.getElementById(t.id)).filter((el): el is HTMLElement => !!el);
    // A topic is "current" while it crosses a band just under the header.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: '-25% 0px -65% 0px' },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [topics]);

  return (
    <nav aria-label="Help topics">
      <ul className={styles.list}>
        {topics.map((t, i) => (
          <li key={t.id} className={styles.item} style={{ '--i': i } as React.CSSProperties}>
            <a href={`#${t.id}`} className={styles.link} aria-current={active === t.id ? 'location' : undefined}>
              <span className={styles.index}>({t.n})</span>
              {t.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
