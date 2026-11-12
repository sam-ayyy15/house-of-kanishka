'use client';

import Link from 'next/link';
import { useState } from 'react';
import { newIn, products } from '@/lib/products';
import { Eyebrow } from '../Eyebrow';
import { ProductGrid } from '../plp/ProductGrid';
import { UnderlineLink } from '../UnderlineLink';
import styles from './SearchView.module.css';

const browse = [
  { label: 'New Arrivals', href: '/new-arrivals' },
  { label: 'Dresses', href: '/dresses' },
  { label: 'Accessories', href: '/accessories' },
];

/**
 * Search over the local catalogue; results update as you type.
 * EXTRAPOLATED – no reference design: composed like the Newsletter section (eyebrow, serif
 * heading, boxed input), with the numbered category list from the Accessories section.
 */
export function SearchView() {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const results = q
    ? products.filter((p) =>
        [p.name, p.colour, p.category, ...p.tags, p.description].join(' ').toLowerCase().includes(q),
      )
    : [];

  return (
    <>
      <section className={styles.top}>
        <Eyebrow>Search</Eyebrow>
        <h1 className={styles.heading}>
          What are you <em>looking for?</em>
        </h1>
        <form className={styles.form} role="search" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="search-input" className="visually-hidden">
            Search products
          </label>
          <input
            id="search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="A piece, a colour or a category"
            autoComplete="off"
            className={styles.input}
          />
        </form>

        {!q && (
          <ul className={styles.browse}>
            {browse.map((b, i) => (
              <li key={b.href}>
                <Link href={b.href} className={styles.browseLink}>
                  <span className={styles.index}>(0{i + 1})</span>
                  {b.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {q && (
          <p className={styles.count} role="status">
            {results.length === 0
              ? `Nothing matches “${query.trim()}”. Try a colour or a category, like “satin” or “bags”.`
              : `${results.length} ${results.length === 1 ? 'piece' : 'pieces'} for “${query.trim()}”`}
          </p>
        )}
      </section>

      {q ? (
        results.length > 0 && <ProductGrid products={results} />
      ) : (
        <section aria-labelledby="search-new-title">
          <div className={styles.rowHead}>
            <h2 id="search-new-title" className={styles.rowTitle}>
              Our New Arrivals
            </h2>
            <UnderlineLink href="/new-arrivals">View all</UnderlineLink>
          </div>
          <ProductGrid products={newIn.slice(0, 5)} />
        </section>
      )}
    </>
  );
}
