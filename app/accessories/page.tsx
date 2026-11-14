import type { Metadata } from 'next';
import { Listing } from '@/components/plp/Listing';
import { ACCESSORY_TABS, accessories } from '@/lib/products';

export const metadata: Metadata = {
  title: 'Accessories · House of Kanishka',
  description: 'Bags, belts, scarves, glasses, jewelry and hats to finish the look.',
  alternates: { canonical: '/accessories' },
};

/** Accessories listing. EXTRAPOLATED – no reference design: reuses the Dresses PLP. */
export default async function AccessoriesPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  return <Listing title="Accessories" products={accessories} tabs={ACCESSORY_TABS} initialTag={type} />;
}
