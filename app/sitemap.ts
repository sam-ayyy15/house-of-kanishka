import type { MetadataRoute } from 'next';
import { collections, collectionHref } from '@/lib/collections';
import { productHref, products } from '@/lib/products';
import { SITE_URL } from '@/lib/site';

/** Every public page: the main sections, each collection and each product. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (path: string, priority: number, changeFrequency: 'daily' | 'weekly' | 'monthly' = 'weekly') => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });
  return [
    page('/', 1, 'daily'),
    page('/new-arrivals', 0.9, 'daily'),
    page('/dresses', 0.9),
    page('/accessories', 0.9),
    page('/lookbook', 0.7),
    page('/the-brand', 0.6, 'monthly'),
    page('/help', 0.4, 'monthly'),
    ...collections.map((c) => page(collectionHref(c.slug), 0.7)),
    ...products.map((p) => page(productHref(p), 0.8)),
  ];
}
