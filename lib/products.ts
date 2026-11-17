// Catalogue types and small helpers shared by server and client code.
// The catalogue itself lives in the database: see lib/catalog.ts (server) and
// components/CatalogProvider.tsx (client). Prices are whole Indian rupees.

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
  price: number;
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
  /** Units in stock per size, as of the last catalogue refresh. The server re-checks at checkout. */
  stock: Record<string, number>;
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
export const productHref = (p: Pick<Product, 'slug'>) => `/products/${p.slug}`;

/** Units left of one size (0 when the size is unknown or sold out). */
export const stockOf = (p: Product, size: string) => p.stock[size] ?? 0;
/** True when no size of the piece is left. */
export const soldOut = (p: Product) => p.sizes.every((s) => stockOf(p, s) <= 0);
/** At or below this many units, a size is shown as "Few left". */
export const LOW_STOCK = 3;

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

