import type { Metadata } from 'next';
import { Listing } from '@/components/plp/Listing';
import { newIn } from '@/lib/products';

export const metadata: Metadata = { title: 'New Arrivals · House of Kanishka' };

/** New Arrivals listing. EXTRAPOLATED – no reference design: reuses the Dresses PLP. */
export default function NewArrivalsPage() {
  return <Listing title="New Arrivals" products={newIn} />;
}
