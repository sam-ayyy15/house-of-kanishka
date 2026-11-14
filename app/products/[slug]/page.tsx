import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Header } from '@/components/Header';
import { PdpGallery } from '@/components/pdp/PdpGallery';
import { PdpInfo } from '@/components/pdp/PdpInfo';
import { ProductGrid } from '@/components/plp/ProductGrid';
import { RiseWords } from '@/components/RiseWords';
import { getProduct, productHref, products } from '@/lib/products';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import styles from './page.module.css';

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const product = getProduct((await params).slug);
  if (!product) return { title: 'House of Kanishka' };
  return {
    title: `${product.name} · House of Kanishka`,
    description: product.description,
    alternates: { canonical: productHref(product) },
    openGraph: {
      type: 'website',
      title: `${product.name} · House of Kanishka`,
      description: product.description,
      images: [{ url: product.image, alt: product.name }],
    },
    twitter: { card: 'summary_large_image', images: [product.image] },
  };
}

/** PDP (spec §6, S1). Mobile order: title → gallery → tabs → selects → purchase (approved). */
export default async function ProductPage({ params }: Params) {
  const product = getProduct((await params).slug);
  if (!product) notFound();

  // "You may also like" is EXTRAPOLATED – no reference design.
  const related = products
    .filter((p) => p.slug !== product.slug && (p.category === product.category || product.category === 'tailoring'))
    .slice(0, 5);

  // The listing this piece belongs to (tailoring has no page of its own: it is shown with the new arrivals).
  const section = {
    dresses: { label: 'Dresses', href: '/dresses' },
    accessories: { label: 'Accessories', href: '/accessories' },
    tailoring: { label: 'New Arrivals', href: '/new-arrivals' },
  }[product.category];

  // Structured data, so search engines can show the price and availability.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.gallery.map((g) => `${SITE_URL}${g.src}`),
    sku: product.slug,
    color: product.colour,
    category: product.category,
    brand: { '@type': 'Brand', name: SITE_NAME },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}${productHref(product)}`,
      priceCurrency: 'EUR',
      price: (product.priceCents / 100).toFixed(2),
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <Header />
      {/* Three or more photos: the S1 layout (title + info above a row of tiles).
          One or two photos: EXTRAPOLATED – no reference design: a split, with the photo
          beside the details so the page is never left half empty. */}
      <main className={styles.main} data-layout={product.gallery.length >= 3 ? 'row' : 'split'}>
        <Breadcrumbs
          className={styles.crumbs}
          items={[{ label: 'Home', href: '/' }, section, { label: product.name }]}
        />
        <h1 className={styles.title} data-rise="load">
          <RiseWords text={product.name} />
        </h1>
        <div className={styles.info}>
          <PdpInfo product={product} />
        </div>
        <div className={styles.gallery}>
          <PdpGallery product={product} />
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
