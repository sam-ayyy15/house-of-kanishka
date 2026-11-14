import type { Metadata } from 'next';
import { Eyebrow } from '@/components/Eyebrow';
import { Header } from '@/components/Header';
import { ContactForm } from '@/components/info/ContactForm';
import { HelpIndex } from '@/components/info/HelpIndex';
import { SIZE_CHART } from '@/lib/sizes';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Help · House of Kanishka',
  description: 'Shipping, returns, size guide and how to reach us.',
  alternates: { canonical: '/help' },
};

const topics = [
  { id: 'shipping', n: '01', label: 'Shipping' },
  { id: 'returns', n: '02', label: 'Returns' },
  { id: 'size-guide', n: '03', label: 'Size Guide' },
  { id: 'support', n: '04', label: 'Support' },
];

const GIANT = 'Help Help Help Help Help Help ';

/**
 * Help: one page for shipping, returns, sizing and support, opened from the three homepage
 * Promo links. EXTRAPOLATED – no reference design. It is built from the site's own devices:
 * the red field with giant travelling black letters (New Collection), the numbered index
 * (Accessories), and the soft grey blob with a script watermark (the Dresses editorial block).
 * Only the policies stated on the homepage (free shipping above €350, 30-day returns,
 * 24/7 support) are given as facts; the rest is marked as still to come.
 */
export default function HelpPage() {
  return (
    <>
      <Header overlayTargetId="hero" />
      <main>
        <section id="hero" className={styles.hero} data-loop>
          <p className={styles.giant} aria-hidden="true">
            <span className={styles.giantLine1}>
              <span className={styles.track}>{GIANT}</span>
            </span>
            <span className={styles.giantLine2}>
              <span className={styles.track}>{GIANT}</span>
            </span>
          </p>
          <div className={styles.heroCopy}>
            <Eyebrow className={styles.rise}>Help</Eyebrow>
            <h1 className={`${styles.heading} ${styles.rise}`}>
              How can we <em>help you?</em>
            </h1>
            <HelpIndex topics={topics} />
          </div>
        </section>

        <div className={styles.topics} data-loop>
          {/* Background: the soft blob and script watermark from the Dresses editorial block. */}
          <svg className={styles.blob} viewBox="0 0 1000 900" preserveAspectRatio="none" aria-hidden="true">
            <ellipse cx="330" cy="430" rx="330" ry="400" />
            <ellipse cx="640" cy="470" rx="250" ry="330" />
          </svg>

          <section id="shipping" className={styles.topic} aria-labelledby="shipping-title">
            <h2 id="shipping-title" className={styles.topicTitle} data-reveal="rise">
              <span className={styles.index}>(01)</span>Free Shipping
            </h2>
            <div className={styles.topicBody} data-reveal="rise" style={{ '--reveal-delay': '80ms' } as React.CSSProperties}>
              <p className={styles.lead}>Enjoy free shipping on all orders above €350. Get your favorite styles delivered to your door.</p>
              <p className="muted">Delivery times and costs for orders under €350 will be listed here.</p>
            </div>
          </section>

          <section id="returns" className={styles.topic} aria-labelledby="returns-title">
            <h2 id="returns-title" className={styles.topicTitle} data-reveal="rise">
              <span className={styles.index}>(02)</span>Easy Returns
            </h2>
            <div className={styles.topicBody} data-reveal="rise" style={{ '--reveal-delay': '80ms' } as React.CSSProperties}>
              <p className={styles.lead}>Not the right fit? No problem. We offer hassle-free returns within 30 days of purchase.</p>
              <p className="muted">The steps for sending a piece back will be listed here.</p>
            </div>
          </section>

          <section id="size-guide" className={styles.topic} aria-labelledby="size-title">
            <h2 id="size-title" className={styles.topicTitle} data-reveal="rise">
              <span className={styles.index}>(03)</span>Size Guide
            </h2>
            {/* Script watermark in the empty space under this title, beside the chart. */}
            <p className={styles.watermark} aria-hidden="true">
              at your
              <br />
              service
            </p>
            <div className={styles.topicBody} data-reveal="rise" style={{ '--reveal-delay': '80ms' } as React.CSSProperties}>
              <p className={styles.lead}>Sizes are shown as letter size and EU size. Measurements are body measurements in centimetres.</p>
              {/* Placeholder chart: standard EU measurements until the brand's own chart is supplied. */}
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Size</th>
                    <th scope="col">Bust</th>
                    <th scope="col">Waist</th>
                    <th scope="col">Hips</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZE_CHART.map((r) => (
                    <tr key={r.size}>
                      <th scope="row">{r.size}</th>
                      <td>{r.bust} cm</td>
                      <td>{r.waist} cm</td>
                      <td>{r.hips} cm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p>Bust: around the fullest part. Waist: around the narrowest part. Hips: around the fullest part, feet together.</p>
            </div>
          </section>

          <section id="support" className={styles.topic} aria-labelledby="support-title">
            <h2 id="support-title" className={styles.topicTitle} data-reveal="rise">
              <span className={styles.index}>(04)</span>24/7 Customer Support
            </h2>
            <div className={styles.topicBody} data-reveal="rise" style={{ '--reveal-delay': '80ms' } as React.CSSProperties}>
              <p className={styles.lead}>Have questions? Our customer support team is here to help you anytime, day or night.</p>
              <ContactForm />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
