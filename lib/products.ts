// Local mock catalogue until the Shopify Storefront API is wired (spec §12.1).
// Images are local-only placeholders (public/placeholders, git-ignored).

export type Product = {
  slug: string;
  name: string;
  priceCents: number;
  image: string;
};

const P = '/placeholders';

/** The only product page that exists so far. Every product card links here for now. */
export const PDP_HREF = '/products/carnivorous-rose-blazer';

export const blazer = {
  slug: 'carnivorous-rose-blazer',
  name: 'Carnivorous Rose Blazer - Black/White Silk Rose',
  priceCents: 50200,
  // Spec §6.2, typos fixed (approved).
  description:
    'With a play on surrealism, the Carnivorous Rose Blazer features only one lapel, the other being consumed by the large silk rose. Using the stem decoratively against the slightly boxier fit of the blazer, or as a means of creatively tying the blazer around the waist for a cinching effect, it will create a gorgeous silhouette.',
  colours: ['Black'],
  sizes: ['XS/34', 'S/36', 'M/38', 'L/40', 'XL/42'],
  gallery: [
    { src: `${P}/pdp-1.jpg`, alt: 'Front view, rose pinned at the lapel and stem worn as a belt' },
    { src: `${P}/pdp-2.jpg`, alt: 'Front view, rose at the lapel with the stem hanging' },
    { src: `${P}/pdp-3.jpg`, alt: 'Back view, stem tied at the waist' },
  ],
};

// Homepage New Arrivals, S4 editorial row (spec §4.2 variant A).
export const newArrivals = {
  dress: { slug: 'flowing-halter-dress', name: 'Flowing Halter Dress', priceCents: 8095, image: `${P}/model-magenta-halter.jpg` },
  earrings: { slug: 'ball-earrings', name: 'Ball Earrings', priceCents: 8095, image: `${P}/ball-earrings.jpg` },
  framed: { slug: 'halter-long-dress', name: 'Halter Long Dress', priceCents: 8095, image: `${P}/halter-long-dress.jpg` },
} satisfies Record<string, Product>;

// Mobile New Arrivals grid (S3 middle).
export const newArrivalsMobile: Product[] = [
  newArrivals.dress,
  { slug: 'strapless-top-trousers', name: 'Strapless Top', priceCents: 8095, image: `${P}/model-cream-strapless.jpg` },
  { slug: 'halter-jumpsuit', name: 'Halter Jumpsuit', priceCents: 8095, image: `${P}/model-cream-jumpsuit.jpg` },
  { slug: 'chain-belt-midi-dress', name: 'Chain Belt Midi Dress', priceCents: 8095, image: `${P}/model-brown-midi.jpg` },
];

// PLP "Dresses" grid, S2 order. Names/prices are not shown in the reference (spec §5.1);
// they are kept for alt text only.
export const dresses: Product[] = [
  { slug: 'patterned-halter-maxi', name: 'Patterned Halter Maxi Dress', priceCents: 0, image: `${P}/model-patterned-maxi.jpg` },
  { slug: 'strapless-top-trousers', name: 'Strapless Top and Trousers', priceCents: 0, image: `${P}/model-cream-strapless.jpg` },
  { slug: 'chain-belt-midi-dress', name: 'Sleeveless Midi Dress with Chain Belt', priceCents: 0, image: `${P}/model-brown-midi.jpg` },
  { slug: 'halter-jumpsuit', name: 'Cream Halter Jumpsuit', priceCents: 0, image: `${P}/model-cream-jumpsuit.jpg` },
  { slug: 'satin-tie-front-set', name: 'Satin Tie-Front Top and Trousers', priceCents: 0, image: `${P}/model-satin-set.jpg` },
];

export const plpAccessories: Product[] = [
  { slug: 'rigid-bracelets', name: 'Pack of 3 Rigid Bracelets', priceCents: 2000, image: `${P}/plp-bracelets.jpg` },
  { slug: 'mini-bag-metal-handle', name: 'Mini Bag with Metal Handle', priceCents: 5500, image: `${P}/plp-mini-bag.jpg` },
];
