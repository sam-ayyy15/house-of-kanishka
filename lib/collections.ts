// Campaign and collection landing pages, linked from the homepage corner labels (spec §4.3, §4.5).
// Titles are from the reference; the one-line intros are placeholder copy.

export type Collection = {
  slug: string;
  eyebrow: string;
  title: string[];
  /** 'video' = campaign loop, 'photo' = full-bleed still, 'ovals' = the red double-ellipse hero. */
  hero: { kind: 'video' | 'photo' | 'ovals'; src?: string; position?: string; positionMobile?: string };
  intro: string;
  products: string[];
};

export const collections: Collection[] = [
  {
    slug: 'ash-x-cos-2025',
    eyebrow: 'Campaign',
    title: ['ASH X COS', '2025'],
    hero: { kind: 'video' },
    intro: 'Colour in motion: the campaign in pieces.',
    products: ['flowing-halter-dress', 'floral-satin-midi-dress', 'wool-beret', 'ivory-satin', 'printed-silk-scarf'],
  },
  {
    slug: 'golden-hour-paris',
    eyebrow: 'New Collection',
    title: ['Golden', 'Hour Paris'],
    hero: { kind: 'ovals' },
    intro: 'Tailoring and evening pieces for the last light of the day.',
    products: ['carnivorous-rose-blazer', 'halter-long-dress', 'mini-bag-with-metal-handle', 'pyramid-leather-tote', 'stacked-bangles'],
  },
  {
    slug: 'midnight-rose',
    eyebrow: 'Campaign',
    title: ['Midnight', 'Rôse'],
    hero: { kind: 'photo', src: '/placeholders/hero.jpg', position: '90% 0%', positionMobile: '53% 0%' },
    intro: 'After dark: deep tones, gold and a single rose.',
    products: ['carnivorous-rose-blazer', 'patterned-halter-maxi-dress', 'ivory-satin', 'rectangular-sunglasses', 'pyramid-leather-tote'],
  },
  {
    slug: 'autumn-edition-paris',
    eyebrow: 'New Collection',
    title: ['Autumn', 'Edition Paris'],
    hero: { kind: 'photo', src: '/placeholders/promo.jpg', position: '50% 0%', positionMobile: '67% 0%' },
    intro: 'Warm browns, satin and leather for the turn of the season.',
    products: ['chain-belt-midi-dress', 'satin-tie-front-set', 'leather-belt', 'wool-beret', 'printed-silk-scarf'],
  },
  {
    slug: 'season-of-grace',
    eyebrow: 'New Collection',
    title: ['Season', 'Of Grace'],
    hero: { kind: 'ovals' },
    intro: 'Soft cream and clean lines.',
    products: ['strapless-top-and-trousers', 'halter-jumpsuit', 'halter-long-dress', 'pack-of-3-rigid-bracelets', 'stacked-bangles'],
  },
];

export const getCollection = (slug: string) => collections.find((c) => c.slug === slug);
export const collectionHref = (slug: string) => `/collections/${slug}`;
