import Link from 'next/link';
import { SITE_URL } from '@/lib/site';
import styles from './Breadcrumbs.module.css';

export type Crumb = { label: string; href?: string };

/**
 * Breadcrumb trail: Home / Section / This page. The last item is the current page (not a link).
 * Also emits BreadcrumbList data so search engines can show the trail. EXTRAPOLATED – no
 * reference design: small uppercase sans like the nav, links that draw an underline on hover.
 */
export function Breadcrumbs({ items, align = 'left', className }: { items: Crumb[]; align?: 'left' | 'center'; className?: string }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${SITE_URL}${c.href}` } : {}),
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className={`${styles.nav} ${className ?? ''}`} data-align={align}>
      <ol className={styles.list}>
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={c.label} className={styles.item}>
              {last || !c.href ? (
                <span className={styles.current} aria-current={last ? 'page' : undefined}>
                  {c.label}
                </span>
              ) : (
                <Link href={c.href} className={styles.link}>
                  {c.label}
                </Link>
              )}
              {!last && (
                <span className={styles.sep} aria-hidden="true">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </nav>
  );
}
