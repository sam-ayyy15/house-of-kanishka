import { Header } from '@/components/Header';
import { Hero } from '@/components/home/Hero';
import { NewArrivals } from '@/components/home/NewArrivals';

export default function HomePage() {
  return (
    <>
      <Header overlayTargetId="hero" />
      <main>
        <Hero />
        <NewArrivals />
      </main>
    </>
  );
}
