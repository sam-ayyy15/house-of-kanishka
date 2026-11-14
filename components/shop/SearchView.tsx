'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { productHref, newIn, type Category } from '@/lib/products';
import { POPULAR_SEARCHES, searchProducts, suggest } from '@/lib/search';
import { Eyebrow } from '../Eyebrow';
import { ProductGrid } from '../plp/ProductGrid';
import { UnderlineLink } from '../UnderlineLink';
import styles from './SearchView.module.css';

const browse = [
  { label: 'New Arrivals', href: '/new-arrivals' },
  { label: 'Dresses', href: '/dresses' },
  { label: 'Accessories', href: '/accessories' },
];

const CATEGORIES: { value: Category | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'dresses', label: 'Dresses' },
  { value: 'tailoring', label: 'Tailoring' },
  { value: 'accessories', label: 'Accessories' },
];

const RECENT_KEY = 'hok-recent-searches';

function readRecent(): string[] {
  try {
    const v = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, 5) : [];
  } catch {
    return [];
  }
}

function writeRecent(list: string[]) {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    // Storage blocked: recent searches just aren't kept.
  }
}

/**
 * Search over the local catalogue; results update as you type, forgive a typo, and can be
 * narrowed by category. Suggestions appear while typing; recent and popular searches when the
 * box is empty. The search is kept in the address (?q=) so a result page can be shared.
 * EXTRAPOLATED – no reference design: composed like the Newsletter section (eyebrow, serif
 * heading, boxed input), with the numbered category list from the Accessories section.
 */
export function SearchView() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [recent, setRecent] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);

  // Saved searches and a ?q= from the address, read after the first render (client only).
  useEffect(() => {
    setRecent(readRecent());
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) setQuery(q.slice(0, 80));
  }, []);

  const q = query.trim();
  const { results: found, corrected } = useMemo(() => searchProducts(q), [q]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: found.length };
    for (const p of found) c[p.category] = (c[p.category] ?? 0) + 1;
    return c;
  }, [found]);
  const results = category === 'all' ? found : found.filter((p) => p.category === category);
  const suggestions = useMemo(() => suggest(q), [q]);

  // The address follows the search.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (q) url.searchParams.set('q', q);
    else url.searchParams.delete('q');
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, '', url);
  }, [q]);

  // A search that found something is remembered once the visitor stops typing.
  useEffect(() => {
    if (q.length < 3 || found.length === 0) return;
    const t = setTimeout(() => remember(q), 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, found.length]);

  function remember(term: string) {
    setRecent((old) => {
      const next = [term, ...old.filter((o) => o.toLowerCase() !== term.toLowerCase())].slice(0, 5);
      writeRecent(next);
      return next;
    });
  }

  function pick(term: string) {
    setQuery(term);
    setCategory('all');
    remember(term);
    input.current?.focus();
  }

  return (
    <>
      <section className={styles.top}>
        <Eyebrow>Search</Eyebrow>
        <h1 className={styles.heading}>
          What are you <em>looking for?</em>
        </h1>
        <form
          className={styles.form}
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (q) remember(q);
          }}
        >
          <label htmlFor="search-input" className="visually-hidden">
            Search products
          </label>
          <input
            ref={input}
            id="search-input"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCategory('all');
            }}
            placeholder="A piece, a colour or a category"
            autoComplete="off"
            className={styles.input}
          />
        </form>

        {/* While typing: words and pieces that start the same way. */}
        {q && suggestions.length > 0 && found.length !== 1 && (
          <ul className={styles.suggestions} aria-label="Suggestions">
            {suggestions.map((s) => (
              <li key={s.kind + s.label} className={styles.suggestion}>
                {s.kind === 'term' ? (
                  <button type="button" onClick={() => pick(s.label)}>
                    {s.label}
                  </button>
                ) : (
                  <Link href={productHref({ slug: s.slug })} onClick={() => remember(s.label)}>
                    {s.label}
                    <span>Piece</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Empty box: where you left off, and what others look for. */}
        {!q && (
          <div className={styles.quick}>
            {recent.length > 0 && (
              <div className={styles.group}>
                <p className={styles.groupTitle}>
                  Recent
                  <button
                    type="button"
                    className={styles.clear}
                    onClick={() => {
                      setRecent([]);
                      writeRecent([]);
                    }}
                  >
                    Clear
                  </button>
                </p>
                <ul className={styles.chips}>
                  {recent.map((r) => (
                    <li key={r}>
                      <button type="button" onClick={() => pick(r)}>
                        {r}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className={styles.group}>
              <p className={styles.groupTitle}>Popular</p>
              <ul className={styles.chips}>
                {POPULAR_SEARCHES.map((r) => (
                  <li key={r}>
                    <button type="button" onClick={() => pick(r)}>
                      {r}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

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
            {found.length === 0
              ? `Nothing matches “${q}”. Try a colour or a category, like “satin” or “bags”.`
              : corrected
                ? `Showing ${found.length} ${found.length === 1 ? 'piece' : 'pieces'} for “${corrected}”.`
                : `${results.length} ${results.length === 1 ? 'piece' : 'pieces'} for “${q}”`}
          </p>
        )}

        {/* Narrow the results by category. */}
        {q && found.length > 0 && Object.keys(counts).length > 2 && (
          <div className={styles.filters} role="group" aria-label="Filter results">
            {CATEGORIES.filter((c) => c.value === 'all' || counts[c.value]).map((c) => (
              <button key={c.value} type="button" aria-pressed={category === c.value} onClick={() => setCategory(c.value)}>
                {c.label} <span>{counts[c.value] ?? 0}</span>
              </button>
            ))}
          </div>
        )}

        {q && found.length === 0 && (
          <ul className={styles.chips}>
            {POPULAR_SEARCHES.map((r) => (
              <li key={r}>
                <button type="button" onClick={() => pick(r)}>
                  {r}
                </button>
              </li>
            ))}
          </ul>
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
