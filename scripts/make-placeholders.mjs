// Generates LOCAL-ONLY placeholder images from reference/ (third-party assets).
// Output: public/placeholders/ (git-ignored). Never ship these files.
// Coordinates are pixels in the source file; tile edges were found with scripts/probe-tiles.mjs.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const OUT = 'public/placeholders';
const V = 'reference/video-frames';
const SS = 'reference/screenshots';
mkdirSync(OUT, { recursive: true });

const rect = (b, fill) =>
  `<rect x="${b.left}" y="${b.top}" width="${b.width}" height="${b.height}" fill="${fill}"/>`;

/**
 * Crop a region and optionally:
 *  - blurBoxes: soften baked-in UI text (blurred copy through a feathered mask)
 *  - whiteBoxes: paint areas white (stray labels next to cut-outs)
 *  - rotate: de-rotate before cropping (degrees, applied to the whole source)
 *  - scale: upscale factor (placeholders are small; avoids tiny intrinsic sizes)
 */
async function crop(src, region, out, opts = {}) {
  const { blurBoxes = [], whiteBoxes = [], sigma = 20, feather = 6, rotate = 0, scale = 1 } = opts;
  let source = sharp(src);
  if (rotate) source = sharp(await source.rotate(rotate, { background: '#ffffff' }).toBuffer());
  const base = await source.extract(region).toBuffer();
  let buf = base;
  if (blurBoxes.length) {
    const m = feather * 2;
    const rects = blurBoxes
      .map((b) => rect({ left: b.left - m, top: b.top - m, width: b.width + 2 * m, height: b.height + 2 * m }, '#fff'))
      .join('');
    const mask = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${region.width}" height="${region.height}">` +
        `<filter id="f" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${feather}"/></filter>` +
        `<g filter="url(#f)">${rects}</g></svg>`,
    );
    const blurred = await sharp(base).blur(sigma).ensureAlpha()
      .composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
    buf = await sharp(buf).composite([{ input: blurred }]).toBuffer();
  }
  if (whiteBoxes.length) {
    const svg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${region.width}" height="${region.height}">${whiteBoxes.map((b) => rect(b, '#fff')).join('')}</svg>`,
    );
    buf = await sharp(buf).composite([{ input: svg }]).toBuffer();
  }
  let img = sharp(buf);
  if (scale !== 1) img = img.resize({ width: Math.round(region.width * scale), kernel: 'lanczos3' });
  await img.jpeg({ quality: 88 }).toFile(`${OUT}/${out}`);
  console.log('wrote', out);
}

// A01 – Hero. Raw source photo supplied by the client (1798×875, no baked-in text).
// Framing is done in CSS with object-position, so the photo is only re-encoded here.
await sharp('reference/images/Glossy Pink Blazer Editorial Portrait.png')
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile(`${OUT}/hero.jpg`);
console.log('wrote hero.jpg');

// A12–A17 – New Arrivals / PLP model cut-outs (white backgrounds). Video frame 02 is the
// sharpest source; the patterned maxi and satin set only exist in S2.
await crop(`${V}/02-new-arrivals.jpg`, { left: 395, top: 455, width: 125, height: 410 }, 'model-cream-strapless.jpg', { scale: 2 });
await crop(`${V}/02-new-arrivals.jpg`, { left: 630, top: 385, width: 150, height: 500 }, 'model-magenta-halter.jpg', { scale: 2 });
await crop(`${V}/02-new-arrivals.jpg`, { left: 915, top: 455, width: 130, height: 410 }, 'model-brown-midi.jpg', { scale: 2 });
await crop(`${V}/02-new-arrivals.jpg`, { left: 1095, top: 460, width: 115, height: 390 }, 'model-cream-jumpsuit.jpg', { scale: 2 });
await crop(`${SS}/02-plp-dresses-mobile-desktop.png`, { left: 120, top: 208, width: 70, height: 216 }, 'model-patterned-maxi.jpg', { scale: 3 });
await crop(`${SS}/02-plp-dresses-mobile-desktop.png`, { left: 952, top: 106, width: 56, height: 190 }, 'model-satin-set.jpg', { scale: 3 });

// A18 – Ball earrings (sits on a CSS ellipse; background matches --vr-grey-oval).
await crop(`${SS}/04-homepage-desktop.png`, { left: 668, top: 470, width: 96, height: 108 }, 'ball-earrings.jpg', { scale: 3 });
// A19 – Halter Long Dress, framed studio photo (~0.84).
await crop(`${SS}/04-homepage-desktop.png`, { left: 792, top: 443, width: 217, height: 258 }, 'halter-long-dress.jpg', { scale: 2 });

// A02 – Campaign still (poster + source for the Ken Burns loop). Corner labels are blurred.
await crop(`${V}/03-campaign.jpg`, { left: 356, top: 324, width: 906, height: 566 }, 'campaign.jpg', {
  blurBoxes: [
    { left: 25, top: 22, width: 125, height: 80 },
    { left: 460, top: 15, width: 125, height: 82 },
    { left: 235, top: 455, width: 115, height: 80 },
    { left: 680, top: 452, width: 140, height: 80 },
  ],
});

// A03 – Who We Are portrait. The reel shows it tilted ~4°; de-rotated, then the red
// script that overlaps its lower part is blurred out.
await crop(`${V}/04-who-we-are.jpg`, { left: 690, top: 520, width: 300, height: 310 }, 'who-we-are.jpg', {
  rotate: 4,
  scale: 1.6,
  blurBoxes: [{ left: 0, top: 235, width: 300, height: 75 }],
});

// A04 – New Collection model inside the double-ellipse. Outside the ovals the source shows
// red and giant letters, so that area is replaced with the studio colour #E1D9D5.
{
  const region = { left: 564, top: 404, width: 472, height: 416 };
  const base = await sharp(`${V}/05-new-collection.jpg`).extract(region).toBuffer();
  const ovals = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${region.width}" height="${region.height}">` +
      `<ellipse cx="${0.35 * region.width}" cy="${0.5 * region.height}" rx="${0.27 * region.width}" ry="${0.46 * region.height}" fill="#fff"/>` +
      `<ellipse cx="${0.665 * region.width}" cy="${0.5 * region.height}" rx="${0.27 * region.width}" ry="${0.46 * region.height}" fill="#fff"/></svg>`,
  );
  const notches = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${region.width}" height="${region.height}" fill="#E1D9D5">` +
      `<rect x="${0.48 * region.width}" y="0" width="${0.22 * region.width}" height="${0.14 * region.height}"/>` +
      `<rect x="${0.3 * region.width}" y="${0.86 * region.height}" width="${0.14 * region.width}" height="${0.14 * region.height}"/></svg>`,
  );
  const inside = await sharp(base).ensureAlpha()
    .composite([{ input: ovals, blend: 'dest-in' }, { input: notches }])
    .png().toBuffer();
  // Composite first, then resize (sharp applies resize before composite in one pipeline).
  const flat = await sharp({ create: { width: region.width, height: region.height, channels: 3, background: '#E1D9D5' } })
    .composite([{ input: inside }])
    .png()
    .toBuffer();
  await sharp(flat)
    .resize({ width: region.width * 2, kernel: 'lanczos3' })
    .jpeg({ quality: 88 })
    .toFile(`${OUT}/new-collection.jpg`);
  console.log('wrote new-collection.jpg');
}

// A06–A11 – Accessories cut-outs (white background). Labels next to them are left out.
await crop(`${V}/06-accessories.jpg`, { left: 742, top: 338, width: 152, height: 182 }, 'acc-bag.jpg', {
  scale: 2,
  whiteBoxes: [{ left: 92, top: 0, width: 60, height: 40 }],
});
await crop(`${V}/06-accessories.jpg`, { left: 402, top: 488, width: 200, height: 60 }, 'acc-belt.jpg', { scale: 2 });
await crop(`${V}/06-accessories.jpg`, { left: 438, top: 676, width: 100, height: 198 }, 'acc-scarf.jpg', { scale: 2 });
await crop(`${V}/06-accessories.jpg`, { left: 686, top: 810, width: 254, height: 94 }, 'acc-glasses.jpg', { scale: 2 });
await crop(`${V}/06-accessories.jpg`, { left: 1078, top: 718, width: 102, height: 114 }, 'acc-bangles.jpg', { scale: 2 });
await crop(`${V}/06-accessories.jpg`, { left: 988, top: 482, width: 190, height: 112 }, 'acc-beret.jpg', { scale: 2 });

// A05 – Promo portrait. Headline and services row are baked in, so they are blurred.
await crop(`${V}/07-promo-services.jpg`, { left: 356, top: 340, width: 890, height: 560 }, 'promo.jpg', {
  blurBoxes: [
    { left: 10, top: 20, width: 210, height: 80 },
    { left: 5, top: 420, width: 870, height: 130 },
  ],
});

// A20–A22 – PDP blazer tiles (S1; tile background #F7F7F7 is part of the crop).
await crop(`${SS}/01-pdp-desktop-tablet.png`, { left: 168, top: 357, width: 220, height: 270 }, 'pdp-1.jpg', { scale: 3 });
await crop(`${SS}/01-pdp-desktop-tablet.png`, { left: 404, top: 357, width: 220, height: 270 }, 'pdp-2.jpg', { scale: 3 });
await crop(`${SS}/01-pdp-desktop-tablet.png`, { left: 640, top: 357, width: 220, height: 270 }, 'pdp-3.jpg', { scale: 3 });

// A23–A26 – PLP editorial block (S2): accessories on the blob, pink dress front/back.
await crop(`${SS}/02-plp-dresses-mobile-desktop.png`, { left: 498, top: 536, width: 84, height: 84 }, 'plp-bracelets.jpg', { scale: 3 });
await crop(`${SS}/02-plp-dresses-mobile-desktop.png`, { left: 620, top: 546, width: 130, height: 124 }, 'plp-mini-bag.jpg', { scale: 3 });
await crop(`${SS}/02-plp-dresses-mobile-desktop.png`, { left: 780, top: 343, width: 108, height: 372 }, 'plp-pink-front.jpg', { scale: 3 });
await crop(`${SS}/02-plp-dresses-mobile-desktop.png`, { left: 936, top: 343, width: 88, height: 362 }, 'plp-pink-back.jpg', { scale: 3 });
