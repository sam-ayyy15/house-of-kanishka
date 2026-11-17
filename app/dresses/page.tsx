import type { Metadata } from 'next';
import { EditorialBlock } from '@/components/plp/EditorialBlock';
import { Listing } from '@/components/plp/Listing';
import { getCatalog, listProducts } from '@/lib/catalog';
import { DRESS_TABS } from '@/lib/products';

export const metadata: Metadata = {
  title: 'Dresses · House of Kanishka',
  description: 'Midi and maxi dresses, jumpsuits, satin and evening pieces from House of Kanishka.',
  alternates: { canonical: '/dresses' },
};

/** PLP "Dresses" (spec §5, S2). */
export default async function DressesPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const catalog = await getCatalog();
  return (
    <Listing
      title="Dresses"
      products={catalog.products.filter((p) => p.category === 'dresses')}
      tabs={DRESS_TABS}
      initialTag={type}
      firstRow={listProducts(catalog, 'plp.dresses_first_row')}
      interstitial={<EditorialBlock />}
      captions="hover"
    />
  );
}
