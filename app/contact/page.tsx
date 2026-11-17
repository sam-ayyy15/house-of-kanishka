import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactForm } from '@/components/info/ContactForm';
import { PolicyPage, type PolicySection } from '@/components/info/PolicyPage';
import { BUSINESS } from '@/lib/business';

export const metadata: Metadata = {
  title: 'Contact Us · House of Kanishka',
  description: 'Write to House of Kanishka: customer care, business details and where to find our policies.',
  alternates: { canonical: '/contact' },
};

const sections: PolicySection[] = [
  {
    id: 'write',
    title: 'Write to us',
    content: (
      <>
        <p>Have a question about a piece, an order or a return? Send us a message and we will reply by email.</p>
        <ContactForm />
      </>
    ),
  },
  {
    id: 'details',
    title: 'Our details',
    content: (
      // PLACEHOLDER business details (lib/business.ts): replace before launch.
      <dl>
        <dt>Business</dt>
        <dd>{BUSINESS.legalName}</dd>
        <dt>Address</dt>
        <dd>
          {BUSINESS.address.map((line) => (
            <span key={line}>
              {line}
              <br />
            </span>
          ))}
        </dd>
        <dt>Email</dt>
        <dd>
          <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
        </dd>
        <dt>Phone</dt>
        <dd>{BUSINESS.phone}</dd>
        <dt>Hours</dt>
        <dd>{BUSINESS.hours}</dd>
      </dl>
    ),
  },
  {
    id: 'policies',
    title: 'Our policies',
    content: (
      <ul>
        <li>
          <Link href="/shipping-policy">Shipping Policy</Link>
        </li>
        <li>
          <Link href="/refund-policy">Refund &amp; Cancellation Policy</Link>
        </li>
        <li>
          <Link href="/terms">Terms &amp; Conditions</Link>
        </li>
        <li>
          <Link href="/privacy">Privacy Policy</Link>
        </li>
      </ul>
    ),
  },
];

export default function ContactPage() {
  return (
    <PolicyPage
      eyebrow="Contact"
      title="We are"
      italic="here for you"
      intro="Customer care, our business details and where to find our policies."
      sections={sections}
      undated
    />
  );
}
