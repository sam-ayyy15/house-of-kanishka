import type { Metadata } from 'next';
import { Eyebrow } from '@/components/Eyebrow';
import { Header } from '@/components/Header';
import { Look } from '@/components/lookbook/Look';
import { RiseWords } from '@/components/RiseWords';
import { UnderlineLink } from '@/components/UnderlineLink';
import { looks } from '@/lib/lookbook';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Lookbook · House of Kanishka',
  description: 'Shop the look: House of Kanishka pieces styled together, with every piece one tap away.',
  alternates: { canonical: '/lookbook' },
};

/** Lookbook: photographs with the pieces tagged on them. EXTRAPOLATED – no reference design. */
export default function LookbookPage() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        <section className={styles.intro}>
          <Eyebrow>Lookbook</Eyebrow>
          <h1 className={styles.heading} data-rise="load">
            <RiseWords text="Shop the" />{' '}
            <em>
              <RiseWords text="look" from={2} />
            </em>
          </h1>
          <p className={styles.lead}>
            Four looks from the house, styled whole. Tap a mark on a photograph to see the piece, its price, and to add it to your bag.
          </p>
        </section>

        {looks.map((look, i) => (
          <Look key={look.id} look={look} flip={i % 2 === 1} />
        ))}

        <section className={styles.closing}>
          <p className={styles.closingText}>
            See every piece, from <em>dresses</em> to <em>accessories</em>.
          </p>
          <UnderlineLink href="/new-arrivals">Shop new arrivals</UnderlineLink>
        </section>
      </main>
    </>
  );
}
