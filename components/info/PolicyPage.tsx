import { POLICIES_UPDATED } from '@/lib/business';
import { Eyebrow } from '../Eyebrow';
import { Header } from '../Header';
import { RiseWords } from '../RiseWords';
import { PolicyNav } from './PolicyNav';
import styles from './PolicyPage.module.css';

export type PolicySection = { id: string; title: string; content: React.ReactNode };

type Props = {
  eyebrow: string;
  /** The heading; `italic` is the part set in the serif italic (the site's two-voice titles). */
  title: string;
  italic?: string;
  intro: string;
  sections: PolicySection[];
  /** Hide the "last updated" line (the Contact page is not a policy). */
  undated?: boolean;
};

/**
 * Terms, Privacy, Refund, Shipping and Contact pages. EXTRAPOLATED – no reference design:
 * the numbered rows of the Help and Account pages (serif title with a small italic index on
 * the left, the text on the right), under a contents list that stays in view.
 */
export function PolicyPage({ eyebrow, title, italic, intro, sections, undated }: Props) {
  const words = title.split(' ').length;
  return (
    <>
      <Header />
      <main className={styles.main}>
        <header className={styles.head}>
          <Eyebrow className={styles.rise}>{eyebrow}</Eyebrow>
          <h1 className={styles.heading} data-rise="load">
            <RiseWords text={title} />
            {italic && (
              <>
                {' '}
                <em>
                  <RiseWords text={italic} from={words} />
                </em>
              </>
            )}
          </h1>
          <p className={`${styles.intro} ${styles.rise}`}>{intro}</p>
          {!undated && <p className={`muted ${styles.rise} ${styles.updated}`}>Last updated {POLICIES_UPDATED}</p>}
        </header>

        <PolicyNav items={sections.map((s) => ({ id: s.id, label: s.title }))} />

        <div className={styles.rows}>
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className={styles.row} aria-labelledby={`${s.id}-title`}>
              <h2 id={`${s.id}-title`} className={styles.rowTitle} data-reveal="rise">
                <span className={styles.index}>({String(i + 1).padStart(2, '0')})</span>
                {s.title}
              </h2>
              <div className={styles.body} data-reveal="rise" style={{ '--reveal-delay': '80ms' } as React.CSSProperties}>
                {s.content}
              </div>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
