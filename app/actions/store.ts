'use server';

import { z } from 'zod';
import { ensureProfile, signedInUserId } from '@/lib/customer';
import { adminDb } from '@/lib/supabase/server';

/**
 * The signed-in customer's bag and wishlist, saved to their account so they follow them
 * from one device to the next. The browser keeps working from its own copy (lib/store.ts);
 * components/StoreSync.tsx calls these to load, merge and save it.
 */
const MAX_QTY = 10;

const input = z.object({
  bag: z.array(z.object({ slug: z.string().max(120), size: z.string().max(20), qty: z.number().int().min(1) })).max(60),
  wishlist: z.array(z.string().max(120)).max(300),
});
export type SavedStore = z.infer<typeof input>;

/** Lookups between what the browser knows (slug + size) and the database ids. */
async function lookups() {
  const db = adminDb();
  const [products, variants] = await Promise.all([
    db.from('products').select('id, slug'),
    db.from('product_variants').select('id, product_id, size'),
  ]);
  if (products.error || variants.error) throw new Error('Catalogue lookup failed');
  const slugOf = new Map(products.data.map((p) => [p.id, p.slug]));
  const productId = new Map(products.data.map((p) => [p.slug, p.id]));
  const variantId = new Map(variants.data.map((v) => [`${slugOf.get(v.product_id)}|${v.size}`, v.id]));
  const lineOf = new Map(variants.data.map((v) => [v.id, { slug: slugOf.get(v.product_id)!, size: v.size }]));
  return { slugOf, productId, variantId, lineOf };
}

async function read(userId: string, maps: Awaited<ReturnType<typeof lookups>>): Promise<SavedStore> {
  const db = adminDb();
  const [bag, wishlist] = await Promise.all([
    db.from('bag_items').select('variant_id, qty').eq('clerk_user_id', userId).order('updated_at'),
    db.from('wishlist_items').select('product_id').eq('clerk_user_id', userId).order('created_at'),
  ]);
  if (bag.error || wishlist.error) throw new Error('Could not read the saved bag');
  return {
    bag: bag.data.flatMap((r) => {
      const line = maps.lineOf.get(r.variant_id);
      return line ? [{ ...line, qty: r.qty }] : [];
    }),
    wishlist: wishlist.data.flatMap((r) => maps.slugOf.get(r.product_id) ?? []),
  };
}

async function write(userId: string, store: SavedStore, maps: Awaited<ReturnType<typeof lookups>>) {
  const db = adminDb();
  const bagRows = new Map<string, number>();
  for (const l of store.bag) {
    const id = maps.variantId.get(`${l.slug}|${l.size}`);
    if (id) bagRows.set(id, Math.min(MAX_QTY, (bagRows.get(id) ?? 0) + l.qty));
  }
  const wishIds = [...new Set(store.wishlist.flatMap((s) => maps.productId.get(s) ?? []))];
  const list = (ids: string[]) => `(${ids.join(',')})`;

  const bagIds = [...bagRows.keys()];
  const results = await Promise.all([
    bagIds.length
      ? db.from('bag_items').upsert(bagIds.map((variant_id) => ({ clerk_user_id: userId, variant_id, qty: bagRows.get(variant_id)! })))
      : null,
    bagIds.length
      ? db.from('bag_items').delete().eq('clerk_user_id', userId).not('variant_id', 'in', list(bagIds))
      : db.from('bag_items').delete().eq('clerk_user_id', userId),
    wishIds.length
      ? db.from('wishlist_items').upsert(wishIds.map((product_id) => ({ clerk_user_id: userId, product_id })), { ignoreDuplicates: true })
      : null,
    wishIds.length
      ? db.from('wishlist_items').delete().eq('clerk_user_id', userId).not('product_id', 'in', list(wishIds))
      : db.from('wishlist_items').delete().eq('clerk_user_id', userId),
  ]);
  if (results.some((r) => r?.error)) throw new Error('Could not save the bag');
}

/** The saved bag and wishlist, for a browser that already belongs to this customer. */
export async function loadSavedStore(): Promise<SavedStore | null> {
  const userId = await signedInUserId();
  if (!userId) return null;
  try {
    return await read(userId, await lookups());
  } catch {
    return null;
  }
}

/**
 * At sign-in: adds what the guest collected in this browser to what the account already
 * holds, saves the result and returns it. A piece in both keeps the larger quantity.
 */
export async function mergeSavedStore(local: SavedStore): Promise<SavedStore | null> {
  const userId = await signedInUserId();
  const parsed = input.safeParse(local);
  if (!userId || !parsed.success) return null;
  try {
    await ensureProfile(userId);
    const maps = await lookups();
    const saved = await read(userId, maps);
    const bag = new Map(saved.bag.map((l) => [`${l.slug}|${l.size}`, l]));
    for (const l of parsed.data.bag) {
      const key = `${l.slug}|${l.size}`;
      if (!maps.variantId.has(key)) continue;
      bag.set(key, { ...l, qty: Math.min(MAX_QTY, Math.max(l.qty, bag.get(key)?.qty ?? 0)) });
    }
    const merged: SavedStore = {
      bag: [...bag.values()],
      wishlist: [...new Set([...saved.wishlist, ...parsed.data.wishlist.filter((s) => maps.productId.has(s))])],
    };
    await write(userId, merged, maps);
    return merged;
  } catch {
    return null;
  }
}

/** Replaces the saved bag and wishlist with the browser's current ones. */
export async function saveStore(local: SavedStore): Promise<boolean> {
  const userId = await signedInUserId();
  const parsed = input.safeParse(local);
  if (!userId || !parsed.success) return false;
  try {
    await ensureProfile(userId);
    await write(userId, parsed.data, await lookups());
    return true;
  } catch {
    return false;
  }
}
