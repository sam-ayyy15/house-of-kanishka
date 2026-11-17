import type { Metadata } from 'next';
import Link from 'next/link';
import { PolicyPage, type PolicySection } from '@/components/info/PolicyPage';
import { getCatalog } from '@/lib/catalog';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy · House of Kanishka',
  description: 'Returns within 30 days, refunds to your original payment method, and how to cancel an order.',
  alternates: { canonical: '/refund-policy' },
};

export default async function RefundPolicyPage() {
  const { settings } = await getCatalog();
  const days = settings.returnsDays;

  const sections: PolicySection[] = [
    {
      id: 'returns',
      title: 'Returns',
      content: (
        <>
          <p>Not the right fit? No problem. You can return a piece within {days} days of the day it was delivered.</p>
          <p>To be accepted, a piece must come back as it left us:</p>
          <ul>
            <li>unworn, unwashed and unaltered;</li>
            <li>with its original tags and packaging;</li>
            <li>with the bill or order number.</li>
          </ul>
        </>
      ),
    },
    {
      id: 'how',
      title: 'How to return',
      content: (
        <ul>
          <li>
            Write to us through the <Link href="/contact">Contact page</Link> with your order number and the piece you want to return.
          </li>
          <li>We confirm the return and arrange a pickup from your address.</li>
          <li>Once the piece reaches us and has been checked, we issue your refund.</li>
        </ul>
      ),
    },
    {
      id: 'refunds',
      title: 'Refunds',
      content: (
        <>
          <ul>
            <li>
              <strong>Paid online:</strong> the refund goes back to the payment method you used (card, UPI, net banking or wallet).
            </li>
            <li>
              <strong>Cash on delivery:</strong> the refund is sent to a bank account or UPI ID that you give us.
            </li>
          </ul>
          <p>
            We start the refund as soon as the returned piece has been checked. After that, banks and payment providers usually take 5 to 7
            working days to show the money in your account.
          </p>
        </>
      ),
    },
    {
      id: 'cancel',
      title: 'Cancellations',
      content: (
        <p>
          You can cancel an order at any time before it is dispatched: write to us with your order number and you are refunded in full. Once
          an order has been dispatched it can no longer be cancelled, but you can return it under this policy after it arrives.
        </p>
      ),
    },
    {
      id: 'faulty',
      title: 'Damaged or wrong pieces',
      content: (
        <p>
          If a piece arrives damaged, faulty or is not what you ordered, tell us within 48 hours of delivery with a photo, and we will
          replace it or refund you in full, including any delivery charge.
        </p>
      ),
    },
  ];

  return (
    <PolicyPage
      eyebrow="Legal"
      title="Refunds &"
      italic="cancellations"
      intro={`Hassle-free returns within ${days} days, refunded to the way you paid.`}
      sections={sections}
    />
  );
}
