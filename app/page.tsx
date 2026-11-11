import { Header } from '@/components/Header';
import { Hero } from '@/components/home/Hero';

export default function HomePage() {
  return (
    <>
      <Header overlayTargetId="hero" />
      <main>
        <Hero />
      </main>
    </>
  );
}
