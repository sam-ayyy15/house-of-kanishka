import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { WishlistView } from '@/components/shop/WishlistView';

export const metadata: Metadata = { title: 'Wishlist · House of Kanishka' };

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
