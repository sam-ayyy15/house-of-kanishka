import Link from 'next/link';
import { Header } from '@/components/Header';

/** 404. EXTRAPOLATED – no reference design. */
export default function NotFound() {
  return (
    <>
      <Header />
      <main className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, textAlign: 'center', paddingTop: '26vh' }}>
        <h1 className="page-title">This page has moved on</h1>
        <p style={{ fontSize: 15 }}>The piece or page you’re looking for isn’t here any more.</p>
        <Link href="/new-arrivals" className="btn btn-black">
          Shop new arrivals
        </Link>
      </main>
    </>
  );
}
