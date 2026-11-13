import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { NewCollection } from '@/components/home/NewCollection';
import { ProductGrid } from '@/components/plp/ProductGrid';
import { RiseWords } from '@/components/RiseWords';
import { UnderlineLink } from '@/components/UnderlineLink';
import { VideoBackground } from '@/components/VideoBackground';
import { collectionHref, collections, getCollection } from '@/lib/collections';
import { getProduct, type Product } from '@/lib/products';
import styles from './page.module.css';

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return collections.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const c = getCollection((await params).slug);
  return { title: c ? `${c.title.join(' ')} · House of Kanishka` : 'House of Kanishka' };
}

/** Campaign / collection landing page. EXTRAPOLATED – no reference design. */
export default async function CollectionPage({ params }: Params) {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();

  const pieces = collection.products.map(getProduct).filter((p): p is Product => !!p);
  const next = collections[(collections.findIndex((c) => c.slug === slug) + 1) % collections.length];

  return (
    <>
      <Header overlayTargetId="hero" />
      <main>
        <div id="hero">
          {collection.hero.kind === 'ovals' ? (
            <NewCollection asHero />
          ) : (
            <section className={styles.hero} aria-label={collection.title.join(' ')}>
              {collection.hero.kind === 'video' ? (
                <VideoBackground
                  poster="/placeholders/campaign.jpg"
                  sources={[{ src: '/placeholders/campaign-loop.webm', type: 'video/webm' }]}
                />
              ) : (
                <Image
                  src={collection.hero.src!}
                  alt=""
                  fill
                  priority
                  sizes="100vw"
                  className={styles.heroPhoto}
                  style={
                    {
                      '--pos': collection.hero.position,
                      '--pos-mobile': collection.hero.positionMobile ?? collection.hero.position,
                    } as React.CSSProperties
                  }
                />
              )}
            </section>
          )}
        </div>

        <section className={styles.intro}>
          <p className={styles.eyebrow}>{collection.eyebrow}</p>
          <h1 className={styles.title} data-reveal="words">
            <RiseWords text={collection.title.join(' ')} />
          </h1>
          <p className={styles.introText} data-reveal="rise" style={{ '--reveal-delay': '220ms' } as React.CSSProperties}>
            {collection.intro}
          </p>
        </section>

        <ProductGrid products={pieces} />

        <nav className={styles.next} aria-label="Next collection" data-reveal="rise">
          <p className={styles.eyebrow}>Next</p>
          <UnderlineLink href={collectionHref(next.slug)} className={styles.nextLink}>
            {next.title.join(' ')}
          </UnderlineLink>
        </nav>
      </main>
    </>
  );
}
