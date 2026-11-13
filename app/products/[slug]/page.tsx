import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { PdpGallery } from '@/components/pdp/PdpGallery';
import { PdpInfo } from '@/components/pdp/PdpInfo';
import { ProductGrid } from '@/components/plp/ProductGrid';
import { RiseWords } from '@/components/RiseWords';
import { getProduct, products } from '@/lib/products';
import styles from './page.module.css';

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const product = getProduct((await params).slug);
  return { title: product ? `${product.name} · House of Kanishka` : 'House of Kanishka' };
}

/** PDP (spec §6, S1). Mobile order: title → gallery → tabs → selects → purchase (approved). */
export default async function ProductPage({ params }: Params) {
  const product = getProduct((await params).slug);
  if (!product) notFound();

  // "You may also like" is EXTRAPOLATED – no reference design.
  const related = products
    .filter((p) => p.slug !== product.slug && (p.category === product.category || product.category === 'tailoring'))
    .slice(0, 5);

  return (
    <>
      <Header />
      {/* Three or more photos: the S1 layout (title + info above a row of tiles).
          One or two photos: EXTRAPOLATED – no reference design: a split, with the photo
          beside the details so the page is never left half empty. */}
      <main className={styles.main} data-layout={product.gallery.length >= 3 ? 'row' : 'split'}>
        <h1 className={styles.title} data-rise="load">
          <RiseWords text={product.name} />
        </h1>
        <div className={styles.info}>
          <PdpInfo product={product} />
        </div>
        <div className={styles.gallery}>
          <PdpGallery images={product.gallery} />
        </div>
      </main>
      {related.length > 0 && (
        <section className={styles.related} aria-labelledby="related-title">
          <h2 id="related-title" className={styles.relatedTitle} data-reveal="words">
            <RiseWords text="You may also like" />
          </h2>
          <ProductGrid products={related} />
        </section>
      )}
    </>
  );
}
