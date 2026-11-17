import type { Metadata } from 'next';
import Link from 'next/link';
import { PolicyPage, type PolicySection } from '@/components/info/PolicyPage';
import { BUSINESS } from '@/lib/business';

export const metadata: Metadata = {
  title: 'Terms & Conditions · House of Kanishka',
  description: 'The terms that apply when you use the House of Kanishka website and place an order.',
  alternates: { canonical: '/terms' },
};

const sections: PolicySection[] = [
  {
    id: 'about',
    title: 'About these terms',
    content: (
      <>
        <p>
          This website is operated by {BUSINESS.legalName} (“we”, “us”). By using the site or placing an order, you agree to these terms.
          Please read them together with our <Link href="/privacy">Privacy Policy</Link>, <Link href="/shipping-policy">Shipping Policy</Link> and{' '}
          <Link href="/refund-policy">Refund Policy</Link>.
        </p>
        <p>You must be at least 18 years old, or have the consent of a parent or guardian, to place an order.</p>
      </>
    ),
  },
  {
    id: 'orders',
    title: 'Orders',
    content: (
      <>
        <p>
          Placing an order is an offer to buy. Your order is accepted when we confirm it by email. We may decline or cancel an order, for
          example if a piece is out of stock, a price was shown in error, or a payment cannot be verified. If we cancel an order you have
          paid for, you are refunded in full.
        </p>
        <p>We ship within India only.</p>
      </>
    ),
  },
  {
    id: 'prices',
    title: 'Prices and payment',
    content: (
      <>
        <p>Prices are shown in Indian rupees (INR). Any delivery charge is shown at checkout before you pay.</p>
        <ul>
          <li>
            <strong>Online payment</strong> is handled by Razorpay (UPI, cards, net banking and wallets). Your card or UPI details are entered
            in Razorpay’s secure window and never reach or are stored on our servers.
          </li>
          <li>
            <strong>Cash on delivery</strong> may be offered on eligible orders. We may ask you to confirm a cash-on-delivery order before it
            is dispatched.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'products',
    title: 'Our pieces',
    content: (
      <p>
        We take care to show every piece accurately. Colours can look slightly different from screen to screen, and measurements are
        approximate. Availability shown on the site can change until your order is confirmed.
      </p>
    ),
  },
  {
    id: 'account',
    title: 'Your account',
    content: (
      <p>
        You can shop as a guest or create an account. Keep your sign-in details private and tell us if you think someone else has used your
        account. You can delete your account at any time from the account page.
      </p>
    ),
  },
  {
    id: 'content',
    title: 'Our content',
    content: (
      <p>
        The House of Kanishka name, emblem, photographs, text and designs on this site belong to us or to their respective owners. They may
        not be copied or used commercially without written permission.
      </p>
    ),
  },
  {
    id: 'liability',
    title: 'Liability',
    content: (
      <p>
        Nothing in these terms limits the rights you have as a consumer under Indian law. Beyond those rights, our liability for any order
        is limited to the amount you paid for it, and we are not responsible for indirect losses or for delays caused by events outside
        our reasonable control.
      </p>
    ),
  },
  {
    id: 'law',
    title: 'Law and contact',
    content: (
      <>
        <p>
          These terms are governed by the laws of India. Disputes are subject to the courts of {BUSINESS.jurisdiction}. We may update these
          terms from time to time; the version on this page applies to orders placed after its date.
        </p>
        <p>
          Questions? Write to us through the <Link href="/contact">Contact page</Link>.
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <PolicyPage
      eyebrow="Legal"
      title="Terms &"
      italic="conditions"
      intro="The terms that apply when you use this website and when you place an order with us."
      sections={sections}
    />
  );
}
