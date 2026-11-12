'use client';

import { useMemo, useState } from 'react';
import type { Product } from '@/lib/products';
import { Drawer } from '../Drawer';
import { Header } from '../Header';
import { ProductGrid } from './ProductGrid';
import styles from './Listing.module.css';

type Tab = { label: string; tag: string };
type Sort = 'asc' | 'desc' | 'new';

const SORTS: { value: Sort; label: string }[] = [
  { value: 'asc', label: 'Ascending price' },
  { value: 'desc', label: 'Descending price' },
  { value: 'new', label: 'Newest' },
];

type Props = {
  title: string;
  products: Product[];
  tabs?: Tab[];
  initialTag?: string;
  /** Rendered after the first row when nothing is filtered (the S2 editorial block). */
  interstitial?: React.ReactNode;
  /** Products of the first row, in reference order, when nothing is filtered or sorted. */
  firstRow?: Product[];
  captions?: 'hover' | 'always';
};

/**
 * Product listing (spec §5): title, FILTER, sub-category tabs, SORT BY, grid.
 * The filter panel and sort menu are EXTRAPOLATED – no reference design.
 */
export function Listing({ title, products, tabs, initialTag = '', interstitial, firstRow, captions = 'always' }: Props) {
  const [tag, setTag] = useState(tabs?.some((t) => t.tag === initialTag) ? initialTag : '');
  const [sort, setSort] = useState<Sort | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [colours, setColours] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);

  const allColours = useMemo(() => [...new Set(products.map((p) => p.colour))].sort(), [products]);
  const allSizes = useMemo(() => [...new Set(products.flatMap((p) => p.sizes))], [products]);

  const filtered = useMemo(() => {
    let list = products.filter(
      (p) =>
        (!tag || p.tags.includes(tag)) &&
        (!colours.length || colours.includes(p.colour)) &&
        (!sizes.length || p.sizes.some((s) => sizes.includes(s))),
    );
    if (sort === 'asc') list = [...list].sort((a, b) => a.priceCents - b.priceCents);
    if (sort === 'desc') list = [...list].sort((a, b) => b.priceCents - a.priceCents);
    if (sort === 'new') list = [...list].sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew));
    return list;
  }, [products, tag, colours, sizes, sort]);

  const untouched = !tag && !sort && !colours.length && !sizes.length;
  const activeFilters = colours.length + sizes.length;
  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  // Default view keeps the reference order: first row, editorial block, then the rest.
  const lead = untouched && firstRow ? firstRow : null;
  const rest = lead ? filtered.filter((p) => !lead.includes(p)) : filtered;

  return (
    <>
      <Header mobileLeft="filter" onFilter={() => setFilterOpen(true)} />
      <main className={`page-solid ${styles.main}`}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{title}</h1>
          <button type="button" className={styles.filter} onClick={() => setFilterOpen(true)}>
            Filter{activeFilters ? ` (${activeFilters})` : ''}
          </button>
        </div>

        <div className={styles.toolbar}>
          {tabs ? (
            <div role="group" aria-label={`${title} categories`} className={styles.tabs}>
              {tabs.map((t) => (
                <button
                  key={t.tag}
                  type="button"
                  aria-pressed={tag === t.tag}
                  className={styles.tab}
                  onClick={() => setTag(t.tag)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          ) : (
            <span />
          )}
          <label className={styles.sort}>
            <span className={styles.sortLabel}>Sort by</span>
            <select value={sort ?? 'asc'} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort by">
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Nothing matches these filters.</p>
            <button
              type="button"
              className="text-link"
              onClick={() => {
                setTag('');
                setColours([]);
                setSizes([]);
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {lead && <ProductGrid products={lead} captions={captions} />}
            {lead && interstitial}
            {rest.length > 0 && (
              <div className={lead && !interstitial ? styles.gap : undefined}>
                <ProductGrid products={rest} captions={captions} />
              </div>
            )}
          </>
        )}
      </main>

      <Drawer open={filterOpen} onClose={() => setFilterOpen(false)} side="right" label="Filter">
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Filter</h2>
          <fieldset className={styles.group}>
            <legend>Colour</legend>
            {allColours.map((c) => (
              <label key={c} className={styles.check}>
                <input type="checkbox" checked={colours.includes(c)} onChange={() => toggle(colours, setColours, c)} />
                {c}
              </label>
            ))}
          </fieldset>
          <fieldset className={styles.group}>
            <legend>Size</legend>
            {allSizes.map((s) => (
              <label key={s} className={styles.check}>
                <input type="checkbox" checked={sizes.includes(s)} onChange={() => toggle(sizes, setSizes, s)} />
                {s}
              </label>
            ))}
          </fieldset>
          <div className={styles.panelActions}>
            <button type="button" className="btn btn-black" onClick={() => setFilterOpen(false)}>
              View {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
            </button>
            <button
              type="button"
              className="text-link"
              onClick={() => {
                setColours([]);
                setSizes([]);
              }}
            >
              Clear all
            </button>
          </div>
        </div>
      </Drawer>
    </>
  );
}
