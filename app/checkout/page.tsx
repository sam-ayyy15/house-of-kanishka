import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { CheckoutView } from '@/components/shop/CheckoutView';

export const metadata: Metadata = {
  title: 'Checkout · House of Kanishka',
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <main className="page">
        <CheckoutView />
      </main>
    </>
  );
}
