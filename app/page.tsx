import { Header } from '@/components/Header';
import { Accessories } from '@/components/home/Accessories';
import { Announcement } from '@/components/home/Announcement';
import { Campaign } from '@/components/home/Campaign';
import { Hero } from '@/components/home/Hero';
import { NewArrivals } from '@/components/home/NewArrivals';
import { NewCollection } from '@/components/home/NewCollection';
import { Newsletter } from '@/components/home/Newsletter';
import { Promo } from '@/components/home/Promo';
import { WhoWeAre } from '@/components/home/WhoWeAre';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';

// Section order: spec §4 (reel camera path, confirmed in part by S4). Footer skipped for now.
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', '@id': `${SITE_URL}/#org`, name: SITE_NAME, url: SITE_URL, description: SITE_DESCRIPTION },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#site`,
      url: SITE_URL,
      name: SITE_NAME,
      publisher: { '@id': `${SITE_URL}/#org` },
      potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header overlayTargetId="hero" />
      <main>
        <Hero />
        <Announcement />
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
