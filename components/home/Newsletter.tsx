import { Eyebrow } from '../Eyebrow';
import { NewsletterForm } from './NewsletterForm';
import styles from './Newsletter.module.css';

// Spec §4.8 copy. "world  be" corrected to "world, be" (approved).
const lines: { text: string; italic?: boolean }[][] = [
  [{ text: 'Join the House of Kanishka world, be' }],
  [{ text: 'the first to' }, { text: 'discover new collections', italic: true }],
  [{ text: 'and exclusive offers.' }],
];

/**
 * Homepage §4.8. The heading is revealed word by word: each word rises out of its own
 * mask as the section scrolls into view, then the form follows. At rest it is exactly the
 * reference layout.
 */
export function Newsletter() {
  let w = 0;
  return (
    <section className={styles.section} aria-labelledby="newsletter-title">
      <Eyebrow className={styles.eyebrow}>
        <span data-reveal="fade">Subscribe</span>
      </Eyebrow>
      <h2 id="newsletter-title" className={styles.heading} data-reveal="words">
        {lines.map((line, li) => (
          <span key={li}>
            {li > 0 && <br className={styles.br} />}
            {li > 0 && ' '}
            {line.map((run, ri) => {
              const words = run.text.split(' ').map((word, wi) => (
                <span key={wi}>
                  {(wi > 0 || ri > 0) && ' '}
                  <span className={styles.word} style={{ '--w': w++ } as React.CSSProperties}>
                    <span>{word}</span>
                  </span>
                </span>
              ));
              return run.italic ? <em key={ri}>{words}</em> : <span key={ri}>{words}</span>;
            })}
          </span>
        ))}
      </h2>
      <div className={styles.formWrap} data-reveal="rise">
        <NewsletterForm />
      </div>
    </section>
  );
}
