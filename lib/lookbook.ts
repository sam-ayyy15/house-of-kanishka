// Lookbook types. The looks themselves live in the database: see lib/catalog.ts.
// Hotspot x / y are percentages of the photo.

export type Hotspot = { slug: string; x: number; y: number };

export type Look = {
  id: string;
  number: string;
  title: [string, string];
  copy: string;
  image: string;
  width: number;
  height: number;
  alt: string;
  /** How many of the 12 columns the photo takes on desktop. */
  span: number;
  hotspots: Hotspot[];
};
