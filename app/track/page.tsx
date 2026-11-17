import type { Metadata } from 'next';
import { Emblem } from '@/components/Emblem';
import { Eyebrow } from '@/components/Eyebrow';
import { Handwriting } from '@/components/Handwriting';
import { Header } from '@/components/Header';
import styles from '@/components/order/Track.module.css';
import { TrackForm } from '@/components/order/TrackForm';

export const metadata: Metadata = {
  title: 'Track your order · House of Kanishka',
  description: 'Follow your House of Kanishka order from our hands to yours.',
  alternates: { canonical: '/track' },
};

/**
 * Find an order by its number and email. EXTRAPOLATED – no reference design: the form on the
 * left; on the right the soft grey blob from the Dresses editorial block, the lotus, and a line
 * of script hanging off its edge. Signed-in customers can also use Account → Orders.
 */
export default function TrackPage() {
  return (
    <>
      <Header />
      <main className={styles.lookup}>
        <div className={styles.lookupCopy}>
          <Eyebrow>Orders</Eyebrow>
          <h1 className="page-title">
            Track your <em>order</em>
          </h1>
          <p className={styles.lookupLede}>
            Enter the order number from your confirmation (for example HOK-1001) and the email you ordered with.
          </p>
          <TrackForm />
        </div>
        <div className={styles.lookupVisual} aria-hidden="true">
          <svg className={styles.blob} viewBox="0 0 1000 900" preserveAspectRatio="none">
            <ellipse cx="430" cy="430" rx="400" ry="400" />
            <ellipse cx="660" cy="500" rx="300" ry="340" />
          </svg>
          <Emblem bloom="load" className={styles.lookupLotus} delay={300} />
          <p className={styles.lookupScript} data-write="load" style={{ '--write-delay': '900ms' } as React.CSSProperties}>
            <span>
              <Handwriting text="from our hands" decorative />
            </span>
            <span className={styles.lookupScript2}>
              <Handwriting text="to yours" from={13} decorative />
            </span>
          </p>
        </div>
      </main>
    </>
  );
}
