import type { Product } from '@/lib/products';
import { Eyebrow } from '../Eyebrow';
import { Handwriting } from '../Handwriting';
import { Header } from '../Header';
import { RiseWords } from '../RiseWords';
import { NotifyForm } from './NotifyForm';
import { ProductGrid } from './ProductGrid';
import styles from './ComingSoon.module.css';

type Props = { category: string; title: string; pieces: Product[] };

/**
 * A category that has not launched yet (admin switch): the listing's own grid, shown as
 * pictures only (no prices, links or quick view), under a "coming soon" heading with a
 * "Notify me" sign-up. EXTRAPOLATED – no reference design: built from the listing title,
 * the Who We Are script and the newsletter form.
 */
export function ComingSoon({ category, title, pieces }: Props) {
  return (
    <>
      <Header />
      <main className={styles.main}>
        <section className={styles.intro} aria-labelledby="coming-soon-title">
          <Eyebrow>{title}</Eyebrow>
          <h1 id="coming-soon-title" className={styles.heading} data-rise="load">
            <RiseWords text="Coming" />{' '}
            <em>
              <RiseWords text="soon" from={1} />
            </em>
          </h1>
          {/* Decorative flourish across the heading, written after the words have risen. */}
          <p className={styles.script} aria-hidden="true" data-write="load" style={{ '--write-delay': '900ms' } as React.CSSProperties}>
            <Handwriting text="to the house" decorative />
          </p>
          <p className={styles.lead}>
            Our {title.toLowerCase()} are on their way. Leave your email and we’ll write to you the day they arrive.
          </p>
          <NotifyForm category={category} />
        </section>

        {pieces.length > 0 && (
          <section aria-label={`${title}, a first look`}>
            <ProductGrid products={pieces} columns={4} teaser />
          </section>
        )}
      </main>
    </>
  );
}
