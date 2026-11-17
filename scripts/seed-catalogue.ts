// Copies the catalogue from the old lib/*.ts data files into the database.
// Safe to run again: rows are matched by slug / id and updated in place. Stock is only set
// when a variant is first created, so re-running never overwrites real stock counts.
//   node --env-file=.env.local scripts/seed-catalogue.ts
import { createClient } from '@supabase/supabase-js';
import { products, newArrivals, newArrivalsMobile, dressesFirstRow, plpAccessories, FREE_SHIPPING } from './seed-data/products.ts';
import { collections } from './seed-data/collections.ts';
import { looks } from './seed-data/lookbook.ts';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (.env.local).');
const db = createClient(url, key, { auth: { persistSession: false } });

/** Placeholder opening stock per size, until real counts are entered in the admin area. */
const OPENING_STOCK = 10;

const must = <T,>(r: { data: T; error: { message: string } | null }, what: string): T => {
  if (r.error) throw new Error(`${what}: ${r.error.message}`);
  return r.data;
};

// Tailoring is sold with the dresses at launch; accessories wait behind "coming soon".
must(await db.from('categories').upsert([
  { slug: 'dresses', name: 'Dresses', launch_state: 'live', sort_order: 1 },
  { slug: 'tailoring', name: 'Tailoring', launch_state: 'live', sort_order: 2 },
  { slug: 'accessories', name: 'Accessories', launch_state: 'coming_soon', sort_order: 3 },
], { onConflict: 'slug', ignoreDuplicates: true }), 'categories');

const rows = products.map((p, i) => ({
  slug: p.slug, name: p.name, price_inr: p.price, category_slug: p.category, card: p.card, tags: p.tags,
  is_new: !!p.isNew, colour: p.colour, description: p.description, details: p.details, image: p.image,
  gallery: p.gallery, colourways: p.colourways ?? null, status: 'live', sort_order: i,
}));
const saved = must(await db.from('products').upsert(rows, { onConflict: 'slug' }).select('id, slug'), 'products');
const idOf = new Map((saved ?? []).map((r) => [r.slug, r.id]));

const sku = (slug: string, size: string) =>
  `HOK-${slug}-${size}`.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/-+$/, '');
const variants = products.flatMap((p) =>
  p.sizes.map((size, i) => ({ product_id: idOf.get(p.slug)!, colour: p.colour, size, sku: sku(p.slug, size), stock: OPENING_STOCK, sort_order: i })),
);
// ignoreDuplicates: existing variants (and their stock) are left untouched.
must(await db.from('product_variants').upsert(variants, { onConflict: 'product_id,colour,size', ignoreDuplicates: true }), 'variants');

must(await db.from('collections').upsert(
  collections.map((c, i) => ({ slug: c.slug, eyebrow: c.eyebrow, title: c.title, hero: c.hero, intro: c.intro, sort_order: i })),
  { onConflict: 'slug' },
), 'collections');
must(await db.from('collection_products').delete().in('collection_slug', collections.map((c) => c.slug)), 'collection products (clear)');
must(await db.from('collection_products').insert(
  collections.flatMap((c) => c.products.map((slug, position) => ({ collection_slug: c.slug, product_id: idOf.get(slug)!, position }))),
), 'collection products');

must(await db.from('looks').upsert(
  looks.map((l, i) => ({ id: l.id, number: l.number, title: l.title, copy: l.copy, image: l.image, width: l.width, height: l.height, alt: l.alt, span: l.span, sort_order: i })),
  { onConflict: 'id' },
), 'looks');
must(await db.from('look_hotspots').delete().in('look_id', looks.map((l) => l.id)), 'hotspots (clear)');
must(await db.from('look_hotspots').insert(
  looks.flatMap((l) => l.hotspots.map((h) => ({ look_id: l.id, product_id: idOf.get(h.slug)!, x: h.x, y: h.y }))),
), 'hotspots');

must(await db.from('curated_lists').upsert([
  { key: 'home.new_arrivals', product_slugs: [newArrivals.dress.slug, newArrivals.oval.slug, newArrivals.framed.slug] },
  { key: 'home.new_arrivals_mobile', product_slugs: newArrivalsMobile.map((p) => p.slug) },
  { key: 'plp.dresses_first_row', product_slugs: dressesFirstRow.map((p) => p.slug) },
  { key: 'plp.accessories', product_slugs: plpAccessories.map((p) => p.slug) },
], { onConflict: 'key' }), 'curated lists');

// Settings are only created, never overwritten (the admin area owns them afterwards).
must(await db.from('settings').upsert([
  { key: 'free_shipping_threshold_inr', value: FREE_SHIPPING },
  { key: 'shipping_fee_inr', value: 0 },          // fee below the threshold: to be set by the founder
  { key: 'cod_enabled', value: true },
  { key: 'cod_max_order_inr', value: 0 },         // 0 = no upper limit
  { key: 'returns_days', value: 30 },
], { onConflict: 'key', ignoreDuplicates: true }), 'settings');

console.log(`Seeded ${rows.length} products, ${variants.length} variants, ${collections.length} collections, ${looks.length} looks.`);
