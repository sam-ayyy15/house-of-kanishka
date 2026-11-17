import type { Metadata } from 'next';
import { ComingSoon } from '@/components/plp/ComingSoon';
import { Listing } from '@/components/plp/Listing';
import { getCatalog, isComingSoon } from '@/lib/catalog';
import { ACCESSORY_TABS } from '@/lib/products';

export const metadata: Metadata = {
  title: 'Accessories · House of Kanishka',
  description: 'Bags, belts, scarves, glasses, jewelry and hats to finish the look.',
  alternates: { canonical: '/accessories' },
};

/**
 * Accessories listing. EXTRAPOLATED – no reference design: reuses the Dresses PLP.
 * Until the category launches (admin switch), the page is a "coming soon" teaser instead.
 */
export default async function AccessoriesPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const catalog = await getCatalog();
  if (isComingSoon(catalog, 'accessories')) {
    return <ComingSoon category="accessories" title="Accessories" pieces={catalog.teasers.filter((p) => p.category === 'accessories')} />;
  }
  return (
    <Listing
      title="Accessories"
      products={catalog.products.filter((p) => p.category === 'accessories')}
      tabs={ACCESSORY_TABS}
      initialTag={type}
    />
  );
}
