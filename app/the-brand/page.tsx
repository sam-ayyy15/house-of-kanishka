import type { Metadata } from 'next';
import Image from 'next/image';
import { Eyebrow } from '@/components/Eyebrow';
import { Handwriting } from '@/components/Handwriting';
import { Header } from '@/components/Header';
import { RiseWords } from '@/components/RiseWords';
import { UnderlineLink } from '@/components/UnderlineLink';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'The Brand · House of Kanishka' };

/**
 * The Brand. EXTRAPOLATED – no reference design. The opening statement is the homepage
 * "Who We Are" copy; the three short notes are placeholder copy in the same voice.
 */
export default function BrandPage() {
  return (
    <>
      <Header overlayTargetId="hero" />
      <main>
        <section id="hero" className={styles.hero} aria-label="The Brand">
          {/* Placeholder: local-only photo. Never ship. */}
          <Image src="/placeholders/hero.jpg" alt="" fill priority sizes="100vw" className={styles.heroPhoto} />
          <h1 className={styles.heroTitle}>
            <span>the</span>
            <em>house</em>
          </h1>
        </section>

        <section className={styles.statement}>
          <Eyebrow>Who we are</Eyebrow>
          <p className={styles.statementText} data-reveal="words">
            <RiseWords text="Inspired by Parisian elegance and modern simplicity, we create pieces that move with you," />{' '}
            <em>
              <RiseWords text="effortlessly complementing your life and style" from={14} />
            </em>
          </p>
        </section>

        <section className={styles.split}>
          <div className={styles.splitPhoto} data-reveal="curtain">
            <Image src="/placeholders/who-we-are.jpg" alt="" fill sizes="(max-width: 767px) 100vw, 46vw" />
          </div>
          <div className={styles.notes}>
            <article data-reveal="rise">
              <h2 className={styles.noteTitle}>Cut to move</h2>
              <p>Every piece starts from how it is worn: easy through the shoulder, clean at the waist, made to walk in.</p>
            </article>
            <article data-reveal="rise" style={{ '--reveal-delay': '80ms' } as React.CSSProperties}>
              <h2 className={styles.noteTitle}>Fewer, better</h2>
              <p>Small collections, shown in full. Dresses, tailoring and the accessories that finish them.</p>
            </article>
            <article data-reveal="rise" style={{ '--reveal-delay': '160ms' } as React.CSSProperties}>
              <h2 className={styles.noteTitle}>A single red</h2>
              <p>One colour runs through the house, from the set to the stitching.</p>
            </article>
            <UnderlineLink href="/new-arrivals">Discover the collection</UnderlineLink>
          </div>
        </section>

        <section className={styles.closing}>
          <p className={styles.closingScript} aria-hidden="true" data-reveal="write">
            <Handwriting text="Looking for our stories" decorative />
          </p>
          <p className={styles.closingText}>
            See the season in full, from <em>Golden Hour Paris</em> to <em>Season Of Grace</em>.
          </p>
          <UnderlineLink href="/collections/golden-hour-paris">View the collections</UnderlineLink>
        </section>
      </main>
    </>
  );
}
