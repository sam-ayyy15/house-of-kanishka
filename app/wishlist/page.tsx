import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { WishlistView } from '@/components/shop/WishlistView';

export const metadata: Metadata = {
  title: 'Wishlist · House of Kanishka',
  robots: { index: false, follow: false },
};

export default function WishlistPage() {
  return (
    <>
      <Header />
      <main className="page">
        <WishlistView />
      </main>
    </>
  );
}
