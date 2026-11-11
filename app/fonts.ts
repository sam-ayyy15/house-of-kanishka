import { Inter, Instrument_Serif, Mrs_Saint_Delafield, Playfair_Display } from 'next/font/google';

// Placeholder families (spec §2.2, Q2): to be replaced by licensed fonts.
export const serif = Instrument_Serif({
  subsets: ['latin', 'latin-ext'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
});

// Used for the hero word "rose" only: closer to the high-contrast reference italic.
// Playfair Display was picked over Bodoni Moda: its taller x-height matches the reference better.
export const heroItalic = Playfair_Display({
  subsets: ['latin'],
  style: 'italic',
  weight: '500',
  variable: '--font-hero-italic-face',
  display: 'swap',
});

export const script = Mrs_Saint_Delafield({
  subsets: ['latin', 'latin-ext'],
  weight: '400',
  variable: '--font-mrs-saint-delafield',
  display: 'swap',
});

export const sans = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
});
