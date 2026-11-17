import type { Metadata } from 'next';
import Link from 'next/link';
import { CookiePreferencesLink } from '@/components/CookiePreferencesLink';
import { PolicyPage, type PolicySection } from '@/components/info/PolicyPage';
import { BUSINESS } from '@/lib/business';

export const metadata: Metadata = {
  title: 'Privacy Policy · House of Kanishka',
  description: 'What personal data House of Kanishka collects, why, who it is shared with and the choices you have.',
  alternates: { canonical: '/privacy' },
};

const sections: PolicySection[] = [
  {
    id: 'collect',
    title: 'What we collect',
    content: (
      <ul>
        <li>
          <strong>Account details:</strong> your name, email address and sign-in details when you create an account.
        </li>
        <li>
          <strong>Order details:</strong> your name, phone number, delivery address, the pieces you order and the status of your payment.
        </li>
        <li>
          <strong>Messages:</strong> what you send us through the contact form, and your email address if you join the newsletter or a
          waiting list.
        </li>
        <li>
          <strong>Site use:</strong> your bag and wishlist, your cookie choice and, only if you allow it, analytics about how the site is
          used.
        </li>
      </ul>
    ),
  },
  {
    id: 'use',
    title: 'Why we use it',
    content: (
      <ul>
        <li>To take, deliver and support your orders, including returns and refunds.</li>
        <li>To run your account and keep it secure.</li>
        <li>To send the newsletter or a launch notice, only if you asked for it. Every such email has an unsubscribe link.</li>
        <li>To prevent fraud and misuse, and to keep the records the law requires.</li>
      </ul>
    ),
  },
  {
    id: 'share',
    title: 'Who we share it with',
    content: (
      <>
        <p>We never sell your personal data. We share it only with the services that help us run the shop:</p>
        <ul>
          <li>
            <strong>Razorpay</strong>, to take payments. We never see or store your card number, UPI PIN or bank password.
          </li>
          <li>
            <strong>Our courier partners</strong>, to deliver your order: your name, phone number and address.
          </li>
          <li>
            <strong>Clerk</strong> (sign-in), <strong>Supabase</strong> (our database, hosted in India) and our <strong>email providers</strong>,
            which process data on our behalf.
          </li>
          <li>Authorities, where the law requires it.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies',
    content: (
      <p>
        Essential cookies keep you signed in and remember your bag. Analytics and marketing cookies are used only with your consent, which
        you can change at any time: <CookiePreferencesLink />.
      </p>
    ),
  },
  {
    id: 'keep',
    title: 'How long we keep it',
    content: (
      <p>
        We keep account data while your account is open. If you delete your account, your personal details are removed or anonymised. Order
        and billing records are kept for as long as tax and accounting law requires. Newsletter and waiting-list addresses are kept until
        you unsubscribe.
      </p>
    ),
  },
  {
    id: 'rights',
    title: 'Your choices',
    content: (
      <>
        <p>Under India’s Digital Personal Data Protection Act, 2023, you can ask us to:</p>
        <ul>
          <li>show you the personal data we hold about you;</li>
          <li>correct or update it;</li>
          <li>delete it, where we are not required by law to keep it;</li>
          <li>stop sending you marketing, by withdrawing your consent.</li>
        </ul>
        <p>
          You can edit your details and delete your account from the <Link href="/account">account page</Link>. For anything else, or to
          raise a concern, write to <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes',
    content: <p>If this policy changes, the new version is published on this page with its date.</p>,
  },
];

export default function PrivacyPage() {
  return (
    <PolicyPage
      eyebrow="Legal"
      title="Privacy"
      italic="policy"
      intro="What we collect, why we collect it, who sees it and the choices you have."
      sections={sections}
    />
  );
}
