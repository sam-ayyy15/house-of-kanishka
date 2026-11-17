import type { Metadata } from 'next';
import Link from 'next/link';
import { PolicyPage, type PolicySection } from '@/components/info/PolicyPage';
import { getCatalog } from '@/lib/catalog';
import { formatPrice } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Shipping Policy · House of Kanishka',
  description: 'Where House of Kanishka delivers, what delivery costs and how your order is tracked.',
  alternates: { canonical: '/shipping-policy' },
};

export default async function ShippingPolicyPage() {
  const { settings } = await getCatalog();
  const threshold = formatPrice(settings.freeShippingThreshold);

  const sections: PolicySection[] = [
    {
      id: 'where',
      title: 'Where we deliver',
      content: <p>We deliver across India. We do not ship to addresses outside India at present.</p>,
    },
    {
      id: 'cost',
      title: 'Delivery charges',
      content: (
        <>
          <p>Enjoy free shipping on all orders above {threshold}.</p>
          <p>
            {settings.shippingFee > 0
              ? `Orders below ${threshold} carry a delivery charge of ${formatPrice(settings.shippingFee)}.`
              : `For orders below ${threshold}, any delivery charge is shown at checkout before you pay.`}
          </p>
        </>
      ),
    },
    {
      id: 'time',
      title: 'Dispatch and delivery',
      content: (
        <>
          <p>
            Each order is checked and packed by hand before it leaves us. You receive an email when your order is dispatched, with the
            expected delivery date for your PIN code.
          </p>
          <p>Delivery times depend on your location and the courier, and can be longer during sales, festivals and bad weather.</p>
        </>
      ),
    },
    {
      id: 'tracking',
      title: 'Tracking',
      content: (
        <p>
          Once your order is dispatched we send you its tracking details by email. If you have an account, you can also follow the order
          from your <Link href="/account">account page</Link>.
        </p>
      ),
    },
    {
      id: 'cod',
      title: 'Cash on delivery',
      content: (
        <p>
          Cash on delivery may be offered on eligible orders and PIN codes. We may ask you to confirm the order before dispatch. Please keep
          the exact amount ready for the courier.
        </p>
      ),
    },
    {
      id: 'issues',
      title: 'If something goes wrong',
      content: (
        <p>
          If a delivery is missed, the courier usually tries again. If your parcel is late, lost or arrives damaged, write to us through the{' '}
          <Link href="/contact">Contact page</Link> and we will put it right. See also our <Link href="/refund-policy">Refund Policy</Link>.
        </p>
      ),
    },
  ];

  return (
    <PolicyPage
      eyebrow="Legal"
      title="Shipping"
      italic="policy"
      intro="Where we deliver, what it costs and how your order finds its way to you."
      sections={sections}
    />
  );
}
