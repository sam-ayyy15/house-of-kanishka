'use client';

import { createContext, useContext, useMemo } from 'react';
import type { Product } from '@/lib/products';

/**
 * The catalogue for client components (bag, wishlist, quick view, search, lookbook marks).
 * The root layout loads it from the database on the server and hands it down here, so the
 * browser never talks to the database itself. Only pieces that are on sale are included.
 */
type CollectionLink = { slug: string; title: string[] };
type Value = {
  products: Product[];
  get: (slug: string) => Product | undefined;
  collections: CollectionLink[];
  freeShipping: number;
};

const CatalogContext = createContext<Value>({ products: [], get: () => undefined, collections: [], freeShipping: 0 });

export function CatalogProvider({
  products,
  collections,
  freeShipping,
  children,
}: {
  products: Product[];
  collections: CollectionLink[];
  freeShipping: number;
  children: React.ReactNode;
}) {
  const value = useMemo<Value>(() => {
    const bySlug = new Map(products.map((p) => [p.slug, p]));
    return { products, get: (slug) => bySlug.get(slug), collections, freeShipping };
  }, [products, collections, freeShipping]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export const useCatalog = () => useContext(CatalogContext);
