import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/** Everything public is open; the private pages (bag, checkout, account, login) are not indexed. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/account', '/bag', '/checkout', '/login', '/wishlist', '/api/'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
