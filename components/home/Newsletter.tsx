import { Eyebrow } from '../Eyebrow';
import { NewsletterForm } from './NewsletterForm';
import styles from './Newsletter.module.css';

/** Homepage §4.8. "world  be" corrected to "world, be" (approved). */
export function Newsletter() {
  return (
    <section className={styles.section} aria-labelledby="newsletter-title">
      <Eyebrow className={styles.eyebrow}>Subscribe</Eyebrow>
      <h2 id="newsletter-title" className={styles.heading}>
        Join the Vivienne Rôse world, be
        <br className={styles.br} /> the first to <em>discover new collections</em>
        <br className={styles.br} /> and exclusive offers.
      </h2>
      <NewsletterForm />
    </section>
  );
}
