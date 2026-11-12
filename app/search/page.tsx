import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { SearchView } from '@/components/shop/SearchView';

export const metadata: Metadata = { title: 'Search · House of Kanishka' };

export default function SearchPage() {
  return (
    <>
      <Header />
      <main style={{ minHeight: '80vh', paddingBottom: 'var(--section-py)' }}>
        <SearchView />
      </main>
    </>
  );
}
