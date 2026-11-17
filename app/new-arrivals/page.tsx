import type { Metadata } from 'next';
import { Listing } from '@/components/plp/Listing';
import { getCatalog } from '@/lib/catalog';

export const metadata: Metadata = {
  title: 'New Arrivals · House of Kanishka',
  description: 'The newest pieces from House of Kanishka.',
  alternates: { canonical: '/new-arrivals' },
};

/** New Arrivals listing. EXTRAPOLATED – no reference design: reuses the Dresses PLP. */
export default async function NewArrivalsPage() {
  const { products } = await getCatalog();
  return <Listing title="New Arrivals" products={products.filter((p) => p.isNew)} />;
}
