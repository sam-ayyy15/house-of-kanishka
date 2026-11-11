import { Header } from '@/components/Header';
import { Accessories } from '@/components/home/Accessories';
import { Campaign } from '@/components/home/Campaign';
import { Hero } from '@/components/home/Hero';
import { NewArrivals } from '@/components/home/NewArrivals';
import { NewCollection } from '@/components/home/NewCollection';
import { Newsletter } from '@/components/home/Newsletter';
import { Promo } from '@/components/home/Promo';
import { WhoWeAre } from '@/components/home/WhoWeAre';

// Section order: spec §4 (reel camera path, confirmed in part by S4). Footer skipped for now.
export default function HomePage() {
  return (
    <>
      <Header overlayTargetId="hero" />
      <main>
        <Hero />
        <NewArrivals />
        <Campaign />
        <WhoWeAre />
        <NewCollection />
        <Accessories />
        <Promo />
        <Newsletter />
      </main>
    </>
  );
}
