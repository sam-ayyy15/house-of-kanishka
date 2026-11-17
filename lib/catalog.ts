import 'server-only';
import { unstable_cache } from 'next/cache';
import { adminDb } from '@/lib/supabase/server';
import type { Collection } from './collections';
import type { Look } from './lookbook';
import type { Category, Colourway, GalleryImage, Product } from './products';

/**
 * The storefront's view of the database catalogue, loaded in one go and cached.
 *
 * - `products`:  pieces that are on sale (status live, in a category that has launched).
 * - `teasers`:   live pieces in a "coming soon" category: shown as pictures only, never sold,
 *                and with no product page.
 * - Collections, looks and curated lists only ever reference pieces that are on sale.
 *
 * Cached under the tag CATALOG_TAG; anything that changes the catalogue (admin edits, an order
 * taking stock) calls revalidateTag(CATALOG_TAG, 'max'). It also refreshes itself every 5 minutes.
 */
export const CATALOG_TAG = 'catalog';

export type ShopSettings = {
  freeShippingThreshold: number;
  shippingFee: number;
  codEnabled: boolean;
  /** 0 = no upper limit. */
  codMaxOrder: number;
  returnsDays: number;
};

export type Catalog = {
  products: Product[];
  teasers: Product[];
  comingSoon: Category[];
  collections: Collection[];
  looks: Look[];
  lists: Record<string, string[]>;
  settings: ShopSettings;
};

const DEFAULT_SETTINGS: ShopSettings = { freeShippingThreshold: 3500, shippingFee: 0, codEnabled: true, codMaxOrder: 0, returnsDays: 30 };

async function load(): Promise<Catalog> {
  const db = adminDb();
  const [categories, productRows, variantRows, collectionRows, collectionProducts, lookRows, hotspotRows, listRows, settingRows] =
    await Promise.all([
      db.from('categories').select('slug, launch_state'),
      db.from('products').select('*').eq('status', 'live').order('sort_order'),
      db.from('product_variants').select('product_id, size, stock, sort_order').order('sort_order'),
      db.from('collections').select('*').eq('status', 'live').order('sort_order'),
      db.from('collection_products').select('collection_slug, product_id, position').order('position'),
      db.from('looks').select('*').order('sort_order'),
      db.from('look_hotspots').select('look_id, product_id, x, y'),
      db.from('curated_lists').select('key, product_slugs'),
      db.from('settings').select('key, value'),
    ]);
  for (const r of [categories, productRows, variantRows, collectionRows, collectionProducts, lookRows, hotspotRows, listRows, settingRows]) {
    if (r.error) throw new Error(`Catalogue could not be loaded: ${r.error.message}`);
  }

  const comingSoon = categories.data!.filter((c) => c.launch_state === 'coming_soon').map((c) => c.slug as Category);

  const variantsOf = new Map<string, { size: string; stock: number }[]>();
  for (const v of variantRows.data!) {
    const list = variantsOf.get(v.product_id) ?? [];
    list.push({ size: v.size, stock: v.stock });
    variantsOf.set(v.product_id, list);
  }

  const slugOfId = new Map<string, string>();
  const all: Product[] = productRows.data!.map((r) => {
    slugOfId.set(r.id, r.slug);
    const variants = variantsOf.get(r.id) ?? [];
    return {
      slug: r.slug,
      name: r.name,
      price: r.price_inr,
      image: r.image,
      card: r.card as Product['card'],
      category: r.category_slug as Category,
      tags: r.tags,
      ...(r.is_new ? { isNew: true } : {}),
      colour: r.colour,
      sizes: variants.map((v) => v.size),
      description: r.description,
      details: r.details,
      gallery: r.gallery as unknown as GalleryImage[],
      ...(r.colourways ? { colourways: r.colourways as unknown as Colourway[] } : {}),
      stock: Object.fromEntries(variants.map((v) => [v.size, v.stock])),
    };
  });

  const products = all.filter((p) => !comingSoon.includes(p.category));
  const teasers = all.filter((p) => comingSoon.includes(p.category));
  const onSale = new Set(products.map((p) => p.slug));

  const collections: Collection[] = collectionRows.data!.map((c) => ({
    slug: c.slug,
    eyebrow: c.eyebrow,
    title: c.title,
    hero: c.hero as unknown as Collection['hero'],
    intro: c.intro,
    products: collectionProducts.data!
      .filter((cp) => cp.collection_slug === c.slug)
      .map((cp) => slugOfId.get(cp.product_id))
      .filter((s): s is string => !!s && onSale.has(s)),
  }));

  const looks: Look[] = lookRows.data!.map((l) => ({
    id: l.id,
    number: l.number,
    title: [l.title[0] ?? '', l.title[1] ?? ''],
    copy: l.copy,
    image: l.image,
    width: l.width,
    height: l.height,
    alt: l.alt,
    span: l.span,
    hotspots: hotspotRows.data!
      .filter((h) => h.look_id === l.id)
      .map((h) => ({ slug: slugOfId.get(h.product_id) ?? '', x: Number(h.x), y: Number(h.y) }))
      .filter((h) => onSale.has(h.slug)),
  }));

  const lists = Object.fromEntries(listRows.data!.map((l) => [l.key, l.product_slugs]));

  const raw = Object.fromEntries(settingRows.data!.map((s) => [s.key, s.value]));
  const num = (k: string, fallback: number) => (typeof raw[k] === 'number' ? (raw[k] as number) : fallback);
  const settings: ShopSettings = {
    freeShippingThreshold: num('free_shipping_threshold_inr', DEFAULT_SETTINGS.freeShippingThreshold),
    shippingFee: num('shipping_fee_inr', DEFAULT_SETTINGS.shippingFee),
    codEnabled: typeof raw.cod_enabled === 'boolean' ? raw.cod_enabled : DEFAULT_SETTINGS.codEnabled,
    codMaxOrder: num('cod_max_order_inr', DEFAULT_SETTINGS.codMaxOrder),
    returnsDays: num('returns_days', DEFAULT_SETTINGS.returnsDays),
  };

  return { products, teasers, comingSoon, collections, looks, lists, settings };
}

export const getCatalog = unstable_cache(load, ['catalog-v1'], { tags: [CATALOG_TAG], revalidate: 300 });

// ---------- Small lookups over a loaded catalogue ----------

export const findProduct = (c: Catalog, slug: string) => c.products.find((p) => p.slug === slug);

/** The pieces of a curated list, in order, skipping any that are no longer on sale. */
export function listProducts(c: Catalog, key: string): Product[] {
  return (c.lists[key] ?? []).map((slug) => findProduct(c, slug)).filter((p): p is Product => !!p);
}

export const isComingSoon = (c: Catalog, category: Category) => c.comingSoon.includes(category);
