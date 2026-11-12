import type { Metadata } from 'next';
import { ContactForm } from '@/components/info/ContactForm';
import { InfoPage } from '@/components/info/InfoPage';

export const metadata: Metadata = { title: 'Contact Us · House of Kanishka' };

export default function ContactPage() {
  return (
    <InfoPage title="Contact Us" current="/contact">
      <p>Have questions? Our customer support team is here to help you anytime, day or night.</p>
      <ContactForm />
    </InfoPage>
  );
}
