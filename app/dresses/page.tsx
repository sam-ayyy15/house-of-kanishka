import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { CategoryTabs } from '@/components/plp/CategoryTabs';
import { EditorialBlock } from '@/components/plp/EditorialBlock';
import { ProductGrid } from '@/components/plp/ProductGrid';
import { dresses } from '@/lib/products';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Dresses · Vivienne Rôse' };

/** PLP "Dresses" (spec §5, S2). */
export default function DressesPage() {
  return (
    <>
      <Header mobileLeft="filter" />
      <main className={`page-solid ${styles.main}`}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Dresses</h1>
          {/* What FILTER opens is [M]; inert for now. Mobile shows it in the header instead. */}
          <button type="button" className={styles.filter}>
            Filter
          </button>
        </div>

        <div className={styles.toolbar}>
          <CategoryTabs />
          {/* Sort control type is [M]: shown as a static trigger with the current value. */}
          <button type="button" className={styles.sort}>
            <span className={styles.sortLabel}>Sort by</span> Ascending price
          </button>
        </div>

        <ProductGrid products={dresses} />
        <EditorialBlock />
        {/* The reference ends after the editorial block; the row repeats (approved) until
            pagination is designed ([M]). */}
        <ProductGrid products={dresses} />
      </main>
    </>
  );
}
