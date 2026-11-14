// Local mock catalogue until a commerce backend is connected (spec §12.1).
// Images are local-only placeholders (public/placeholders, git-ignored).
// Names and prices marked "reference" come from the mockups; everything else is placeholder.

export type Category = 'dresses' | 'tailoring' | 'accessories';

export type GalleryImage = { src: string; alt: string; fit: 'cover' | 'contain' };

/**
 * A colour a piece comes in. `gallery` is that colour's own set of photos; when it is left out
 * the piece's main gallery is shown. Add one entry per colour once the photography exists.
 */
export type Colourway = { name: string; hex: string; gallery?: GalleryImage[] };

export type Product = {
  slug: string;
  name: string;
  priceCents: number;
  /** Card image. */
  image: string;
  /** How cards show it: a cut-out on white, an object on a grey tile, or a framed photo. */
  card: 'cutout' | 'tile' | 'photo';
  category: Category;
  /** Sub-category tags used by listing tabs. */
  tags: string[];
  isNew?: boolean;
  colour: string;
  sizes: string[];
  description: string;
  details: string[];
  gallery: GalleryImage[];
  /** Every colour the piece comes in. Without it, the piece has just its own `colour`. */
  colourways?: Colourway[];
};

/** Swatch colours for the colour names used in the catalogue. */
export const COLOUR_HEX: Record<string, string> = {
  Black: '#141414',
  Burgundy: '#6e1424',
  Cream: '#eee5d3',
  Brown: '#6d4b37',
  Pink: '#e2a0b7',
  Ivory: '#f3eee2',
  Gold: '#c9a55c',
  Red: '#a20f15',
};

export function colourwaysOf(p: Product): Colourway[] {
  return p.colourways ?? [{ name: p.colour, hex: COLOUR_HEX[p.colour] ?? '#999999' }];
}

/** The photos to show for a colour (falls back to the piece's main gallery). */
export function galleryFor(p: Product, colour?: string): GalleryImage[] {
  return colourwaysOf(p).find((c) => c.name === colour)?.gallery ?? p.gallery;
}

/** A second photo for hover: the first gallery image that isn't the card image. */
export function altImage(p: Product): GalleryImage | undefined {
  return p.gallery.find((g) => g.src !== p.image);
}

const P = '/placeholders';
const APPAREL_SIZES = ['XS/34', 'S/36', 'M/38', 'L/40', 'XL/42'];
const ONE_SIZE = ['One size'];

function apparel(
  slug: string, name: string, priceCents: number, file: string, tags: string[], colour: string,
  description: string, extra: Partial<Product> = {},
): Product {
  const image = `${P}/${file}.jpg`;
  return {
    slug, name, priceCents, image, card: 'cutout', category: 'dresses', tags, colour, sizes: APPAREL_SIZES, description,
    details: ['Placeholder details: composition and care information will be added here.'],
    gallery: [{ src: image, alt: name, fit: 'contain' }],
    ...extra,
  };
}

function accessory(
  slug: string, name: string, priceCents: number, file: string, tag: string, colour: string,
  description: string, extra: Partial<Product> = {},
): Product {
  const image = `${P}/${file}.jpg`;
  return {
    slug, name, priceCents, image, card: 'tile', category: 'accessories', tags: [tag], colour, sizes: ONE_SIZE, description,
    details: ['Placeholder details: materials and dimensions will be added here.'],
    gallery: [{ src: image, alt: name, fit: 'contain' }],
    ...extra,
  };
}

export const products: Product[] = [
  {
    slug: 'carnivorous-rose-blazer',
    name: 'Carnivorous Rose Blazer - Black/White Silk Rose', // reference (S1)
    priceCents: 50200, // reference
    image: `${P}/pdp-2.jpg`,
    card: 'photo',
    category: 'tailoring',
    tags: [],
    isNew: true,
    colour: 'Black',
    sizes: APPAREL_SIZES,
    // Spec §6.2, typos fixed (approved).
    description:
      'With a play on surrealism, the Carnivorous Rose Blazer features only one lapel, the other being consumed by the large silk rose. Using the stem decoratively against the slightly boxier fit of the blazer, or as a means of creatively tying the blazer around the waist for a cinching effect, it will create a gorgeous silhouette.',
    details: ['Placeholder details: composition and care information will be added here.'],
    gallery: [
      { src: `${P}/pdp-1.jpg`, alt: 'Front view, rose pinned at the lapel and stem worn as a belt', fit: 'cover' },
      { src: `${P}/pdp-2.jpg`, alt: 'Front view, rose at the lapel with the stem hanging', fit: 'cover' },
      { src: `${P}/pdp-3.jpg`, alt: 'Back view, stem tied at the waist', fit: 'cover' },
    ],
  },
  // Image: client photo (reference/images/Burgundy Satin Halter Dress Model.png, scripts/make-model-cutouts.mjs).
  apparel('flowing-halter-dress', 'Flowing Halter Dress', 8095, 'model-burgundy-satin-halter', ['midi-maxi', 'party'], 'Burgundy',
    'A high halter-neck dress in burgundy satin, gathered at the waist and falling to the knee.', { isNew: true }), // reference (S4)
  apparel('patterned-halter-maxi-dress', 'Patterned Halter Maxi Dress', 11900, 'model-patterned-maxi', ['midi-maxi', 'party'], 'Black',
    'A halter maxi dress in a black-and-white print with a tiered, flowing skirt.'),
  apparel('strapless-top-and-trousers', 'Strapless Top and Trousers', 8995, 'model-cream-strapless', ['party'], 'Cream',
    'A cream strapless top worn over matching straight-leg trousers.', { isNew: true }),
  apparel('chain-belt-midi-dress', 'Chain Belt Midi Dress', 9800, 'model-brown-midi', ['midi-maxi'], 'Brown',
    'A sleeveless brown midi dress, finished with a chain belt at the hip.', { isNew: true }),
  apparel('halter-jumpsuit', 'Halter Jumpsuit', 10900, 'model-cream-jumpsuit', ['jumpsuits'], 'Cream',
    'A cream halter-neck jumpsuit with a long, flared leg.', { isNew: true }),
  apparel('satin-tie-front-set', 'Satin Tie-Front Set', 12900, 'model-satin-set', ['satin'], 'Brown',
    'A brown satin tie-front top with wide-leg trousers.'),
  apparel('floral-satin-midi-dress', 'Floral Satin Midi Dress', 13900, 'plp-pink-front', ['satin', 'midi-maxi'], 'Pink',
    'A cowl-neck midi dress in pink floral satin.', {
      gallery: [
        { src: `${P}/plp-pink-front.jpg`, alt: 'Floral Satin Midi Dress, front', fit: 'contain' },
        { src: `${P}/plp-pink-back.jpg`, alt: 'Floral Satin Midi Dress, back', fit: 'contain' },
      ],
    }),
  // reference (S4) name. Image: client photo (reference/images/Burgundy Velvet Gown with Thigh
  // Slit.png, scripts/make-model-cutouts.mjs), a cut-out like the other dresses.
  apparel('halter-long-dress', 'Halter Long Dress', 8095, 'model-burgundy-velvet-gown', ['midi-maxi', 'party'], 'Burgundy',
    'A floor-length halter gown in burgundy velvet, ruched at the hip with a high thigh slit.', { isNew: true }),
  // Was "Ball Earrings" in the reference (S4); renamed and moved to dresses (client request).
  // Image: client photo (reference/images/Ivory Satin Halter Gown Portrait.png, scripts/make-model-cutouts.mjs).
  apparel('ivory-satin', 'Ivory Satin', 8095, 'model-ivory-satin-gown', ['midi-maxi', 'satin'], 'Ivory',
    'A floor-length halter gown in ivory satin, with a corseted waist and soft draping at the hip.', { isNew: true }),

  accessory('pack-of-3-rigid-bracelets', 'Pack of 3 Rigid Bracelets', 2000, 'plp-bracelets', 'jewelry', 'Gold',
    'Three rigid bracelets in wood, cream and gold tones.'), // reference (S2)
  accessory('mini-bag-with-metal-handle', 'Mini Bag with Metal Handle', 5500, 'plp-mini-bag', 'bags', 'Gold',
    'A gold mesh mini bag with a sculptural metal handle and chain strap.'), // reference (S2)
  accessory('pyramid-leather-tote', 'Pyramid Leather Tote', 24500, 'acc-bag', 'bags', 'Black',
    'A black leather tote with a pyramid silhouette and a single top handle.'),
  accessory('leather-belt', 'Leather Belt', 5900, 'acc-belt', 'belts', 'Brown',
    'A brown leather belt with a silver-tone buckle.'),
  accessory('printed-silk-scarf', 'Printed Silk Scarf', 6900, 'acc-scarf', 'scarves', 'Cream',
    'A printed silk scarf with a red border.'),
  accessory('rectangular-sunglasses', 'Rectangular Sunglasses', 8900, 'acc-glasses', 'glasses', 'Black',
    'Black rectangular sunglasses with tortoiseshell temples.'),
  accessory('stacked-bangles', 'Stacked Bangles', 4500, 'acc-bangles', 'jewelry', 'Cream',
    'Two bangles, one marbled cream and one burgundy.'),
  accessory('wool-beret', 'Wool Beret', 4900, 'acc-beret', 'hats', 'Red',
    'A red wool beret.'),
];

const bySlug = new Map(products.map((p) => [p.slug, p]));

export function getProduct(slug: string): Product | undefined {
  return bySlug.get(slug);
}

function need(slug: string): Product {
  const p = bySlug.get(slug);
  if (!p) throw new Error(`Unknown product: ${slug}`);
  return p;
}

export const productHref = (p: Pick<Product, 'slug'>) => `/products/${p.slug}`;

export const dresses = products.filter((p) => p.category === 'dresses');
export const accessories = products.filter((p) => p.category === 'accessories');
export const newIn = products.filter((p) => p.isNew);

// Homepage New Arrivals, S4 editorial row (spec §4.2 variant A).
export const newArrivals = {
  dress: need('flowing-halter-dress'),
  oval: need('ivory-satin'),
  framed: need('halter-long-dress'),
};

// Mobile New Arrivals grid (S3 middle).
export const newArrivalsMobile = [
  need('flowing-halter-dress'),
  need('strapless-top-and-trousers'),
  need('halter-jumpsuit'),
  need('chain-belt-midi-dress'),
];

// PLP "Dresses" first row, S2 order.
export const dressesFirstRow = [
  need('patterned-halter-maxi-dress'),
  need('strapless-top-and-trousers'),
  need('chain-belt-midi-dress'),
  need('halter-jumpsuit'),
  need('satin-tie-front-set'),
];

export const plpAccessories = [need('pack-of-3-rigid-bracelets'), need('mini-bag-with-metal-handle')];

export const DRESS_TABS = [
  { label: 'View all', tag: '' },
  { label: 'Midi | Maxi', tag: 'midi-maxi' },
  { label: 'Jumpsuits', tag: 'jumpsuits' },
  { label: 'Satin', tag: 'satin' },
  { label: 'Party', tag: 'party' },
];

// Order matches the homepage Accessories numbering (01 Bags … 06 Hats).
export const ACCESSORY_TABS = [
  { label: 'View all', tag: '' },
  { label: 'Bags', tag: 'bags' },
  { label: 'Belts', tag: 'belts' },
  { label: 'Scarves', tag: 'scarves' },
  { label: 'Glasses', tag: 'glasses' },
  { label: 'Jewelry', tag: 'jewelry' },
  { label: 'Hats', tag: 'hats' },
];

export const FREE_SHIPPING_CENTS = 35000; // €350 (approved, Q7)
