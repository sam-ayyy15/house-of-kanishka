// Where the site lives, for absolute links in sharing previews, the sitemap and structured data.
// Set NEXT_PUBLIC_SITE_URL (in Vercel's environment settings) once the real domain is chosen.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://house-of-kanishka.vercel.app').replace(/\/$/, '');
export const SITE_NAME = 'House of Kanishka';
export const SITE_DESCRIPTION = 'House of Kanishka: Parisian elegance and modern simplicity. Dresses, tailoring and accessories, in small collections.';
