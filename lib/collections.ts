// Campaign and collection landing pages, linked from the homepage corner labels (spec §4.3, §4.5).
// The collections themselves live in the database: see lib/catalog.ts.

export type Collection = {
  slug: string;
  eyebrow: string;
  title: string[];
  /** 'video' = campaign loop, 'photo' = full-bleed still, 'ovals' = the red double-ellipse hero. */
  hero: { kind: 'video' | 'photo' | 'ovals'; src?: string; position?: string; positionMobile?: string };
  intro: string;
  products: string[];
};

export const collectionHref = (slug: string) => `/collections/${slug}`;
