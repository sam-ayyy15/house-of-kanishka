import type { Metadata } from 'next';
import Link from 'next/link';
import { InfoPage } from '@/components/info/InfoPage';

export const metadata: Metadata = { title: 'Shipping & Returns · House of Kanishka' };

// Only the two policies stated on the homepage (free shipping above €350, 30-day returns)
// are given as facts. Delivery times, carriers and costs are still to be supplied.
export default function ShippingReturnsPage() {
  return (
    <InfoPage title="Shipping & Returns" current="/shipping-returns">
      <h2>Shipping</h2>
      <p>Enjoy free shipping on all orders above €350. Get your favorite styles delivered to your door.</p>
      <p className="muted">Delivery times and costs for orders under €350 will be listed here.</p>
      <h2>Returns</h2>
      <p>Not the right fit? No problem. We offer hassle-free returns within 30 days of purchase.</p>
      <p className="muted">The steps for sending a piece back will be listed here.</p>
      <h2>Need help?</h2>
      <p>
        Our customer support team is here to help you anytime, day or night.{' '}
        <Link href="/contact" className="text-link">
          Contact us
        </Link>
      </p>
    </InfoPage>
  );
}
