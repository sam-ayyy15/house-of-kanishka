'use client';

import Link from 'next/link';
import { useState } from 'react';
import { products } from '@/lib/products';
import { ProductGrid } from '../plp/ProductGrid';
import styles from './Simple.module.css';

const suggestions = [
  { label: 'New Arrivals', href: '/new-arrivals' },
  { label: 'Dresses', href: '/dresses' },
  { label: 'Accessories', href: '/accessories' },
];

/** Search over the local catalogue. EXTRAPOLATED – no reference design. */
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
      <h1 className="page-title">Search</h1>
      <form className={styles.searchForm} role="search" onSubmit={(e) => e.preventDefault()}>
        <label className="field">
          <span className="visually-hidden">Search products</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a piece, colour or category"
            autoFocus
          />
        </label>
      </form>

      {!q ? (
        <>
          <p className={styles.suggestTitle}>Browse</p>
          <ul className={styles.suggest}>
            {suggestions.map((s) => (
              <li key={s.href}>
                <Link href={s.href}>{s.label}</Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p className={styles.count} role="status">
            {results.length === 0
              ? `No pieces match “${query.trim()}”. Try a colour or a category, like “satin” or “bags”.`
              : `${results.length} ${results.length === 1 ? 'piece' : 'pieces'}`}
          </p>
          {results.length > 0 && (
            <div className={styles.bleed}>
              <ProductGrid products={results} />
            </div>
          )}
        </>
      )}
    </>
  );
}
