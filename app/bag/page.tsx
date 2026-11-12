import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { BagView } from '@/components/shop/BagView';

export const metadata: Metadata = { title: 'Shopping Bag · House of Kanishka' };

export default function BagPage() {
  return (
    <>
      <Header />
      <main className="page">
        <BagView />
      </main>
    </>
  );
}
