// Renders the site icons from the traced emblem (components/emblem-paths.ts):
//   app/icon.png        512 x 512  favicon, also used by the emails and the payment window
//   app/apple-icon.png  180 x 180  home-screen icon
//
//   node scripts/make-icons.mjs
//
// Black lotus on white, as before, about 85 % of the width and centred. The lotus is line art,
// so icons get extra line weight (in drawing units): browsers shrink the favicon to 16-32 px,
// where the drawing's own lines would almost disappear.
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const src = readFileSync('components/emblem-paths.ts', 'utf8');
const viewBox = src.match(/EMBLEM_VIEWBOX = '([^']+)'/)[1];
const paths = [...src.matchAll(/d: '([^']+)'/g)].map((m) => m[1]);
const [, , VW, VH] = viewBox.split(' ').map(Number);

async function icon(file, size, weight) {
  const w = Math.round(size * 0.85);
  const h = Math.round((w * VH) / VW);
  const lotus = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${w}" height="${h}">${paths
    .map((d) => `<path d="${d}" fill="#000" stroke="#000" stroke-width="${weight}" stroke-linejoin="round"/>`)
    .join('')}</svg>`;
  await sharp({ create: { width: size, height: size, channels: 4, background: '#ffffff' } })
    .composite([{ input: Buffer.from(lotus), left: Math.round((size - w) / 2), top: Math.round((size - h) / 2) }])
    .png()
    .toFile(file);
  console.log(file, `${size}x${size}`, `lotus ${w}x${h}`);
}

await icon('app/icon.png', 512, 16);
await icon('app/apple-icon.png', 180, 12);
