// Lookbook content. The photos are local placeholders, and the pairings (which catalogue piece
// each tag points to) are placeholders too: replace both with the stylist's real tagging.
// Hotspot x / y are percentages of the photo.

export type Hotspot = { slug: string; x: number; y: number };

export type Look = {
  id: string;
  number: string;
  title: [string, string];
  copy: string;
  image: string;
  width: number;
  height: number;
  alt: string;
  /** How many of the 12 columns the photo takes on desktop. */
  span: number;
  hotspots: Hotspot[];
};

export const looks: Look[] = [
  {
    id: 'golden-hour',
    number: '01',
    title: ['Golden', 'hour'],
    copy: 'Burgundy and black lace, held in one long line. A small bag in the hand, because the evening starts before the dress does.',
    image: '/placeholders/new-collection.jpg',
    width: 1337,
    height: 1177,
    alt: 'A model in a burgundy gown with a black lace bodice, holding a small bag and red roses',
    span: 7,
    hotspots: [
      { slug: 'halter-long-dress', x: 45, y: 52 },
      { slug: 'mini-bag-with-metal-handle', x: 41, y: 72 },
    ],
  },
  {
    id: 'crimson',
    number: '02',
    title: ['Crimson', 'light'],
    copy: 'Satin that moves before you do. A halter cut close to the neck, a warm wall behind it, and nothing else asked of the day.',
    image: '/placeholders/promo.jpg',
    width: 1570,
    height: 1002,
    alt: 'A model in a burgundy satin halter top against a red wall',
    span: 7,
    hotspots: [{ slug: 'flowing-halter-dress', x: 60, y: 82 }],
  },
  {
    id: 'rose-lace',
    number: '03',
    title: ['Rose', 'and lace'],
    copy: 'Pink satin with a vein of lace running down the body. Soft, and quietly exact: the kind of piece that is remembered for how it fell.',
    image: '/placeholders/who-we-are.jpg',
    width: 1086,
    height: 1448,
    alt: 'A model in a pink satin halter top with lace trim',
    span: 5,
    hotspots: [{ slug: 'floral-satin-midi-dress', x: 53, y: 50 }],
  },
  {
    id: 'surreal-tailoring',
    number: '04',
    title: ['Surreal', 'tailoring'],
    copy: 'One lapel, one silk rose, and a stem that ties at the waist. Tailoring with a sense of humour, worn straight or cinched.',
    image: '/placeholders/pdp-1.jpg',
    width: 660,
    height: 810,
    alt: 'A black blazer with a white silk rose at the lapel and its stem tied at the waist',
    span: 5,
    hotspots: [{ slug: 'carnivorous-rose-blazer', x: 47, y: 46 }],
  },
];
