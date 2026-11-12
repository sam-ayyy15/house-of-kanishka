import type { Metadata } from 'next';
import { EditorialBlock } from '@/components/plp/EditorialBlock';
import { Listing } from '@/components/plp/Listing';
import { DRESS_TABS, dresses, dressesFirstRow } from '@/lib/products';

export const metadata: Metadata = { title: 'Dresses · House of Kanishka' };

/** PLP "Dresses" (spec §5, S2). */
export default async function DressesPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  return (
    <Listing
      title="Dresses"
      products={dresses}
      tabs={DRESS_TABS}
      initialTag={type}
      firstRow={dressesFirstRow}
      interstitial={<EditorialBlock />}
      captions="hover"
    />
  );
}
