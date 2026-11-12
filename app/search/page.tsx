import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { SearchView } from '@/components/shop/SearchView';

export const metadata: Metadata = { title: 'Search · House of Kanishka' };

export default function SearchPage() {
  return (
    <>
      <Header />
      <main className="page">
        <SearchView />
      </main>
    </>
  );
}
