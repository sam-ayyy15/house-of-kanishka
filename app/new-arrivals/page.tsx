import type { Metadata } from 'next';
import { Listing } from '@/components/plp/Listing';
import { newIn } from '@/lib/products';

export const metadata: Metadata = {
  title: 'New Arrivals · House of Kanishka',
  description: 'The newest pieces from House of Kanishka.',
  alternates: { canonical: '/new-arrivals' },
};

/** New Arrivals listing. EXTRAPOLATED – no reference design: reuses the Dresses PLP. */
export default function NewArrivalsPage() {
  return <Listing title="New Arrivals" products={newIn} />;
}
