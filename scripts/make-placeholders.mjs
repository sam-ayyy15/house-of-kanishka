// Generates LOCAL-ONLY placeholder images from reference/ (third-party assets).
// Output: public/placeholders/ (git-ignored). Never ship these files.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const OUT = 'public/placeholders';
mkdirSync(OUT, { recursive: true });

/**
 * Crop a region, then soften rectangles that contain baked-in UI text: the area is
 * swapped for a blurred copy through a feathered mask, so no hard edges show.
 */
async function crop(src, region, out, { blurBoxes = [], sigma = 20, feather = 6, width } = {}) {
  const base = await sharp(src).extract(region).toBuffer();
  let img = sharp(base);
  if (blurBoxes.length) {
    const rects = blurBoxes
      // Inflate each box by 2× the feather so its interior stays fully opaque.
      .map((b) => {
        const m = feather * 2;
        return `<rect x="${b.left - m}" y="${b.top - m}" width="${b.width + 2 * m}" height="${b.height + 2 * m}" fill="#fff"/>`;
      })
      .join('');
    const mask = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${region.width}" height="${region.height}">` +
        `<filter id="f" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${feather}"/></filter>` +
        `<g filter="url(#f)">${rects}</g></svg>`,
    );
    const blurred = await sharp(base)
      .blur(sigma)
      .ensureAlpha()
      .composite([{ input: mask, blend: 'dest-in' }])
      .png()
      .toBuffer();
    img = sharp(await sharp(base).composite([{ input: blurred }]).toBuffer());
  }
  if (width) img = img.resize({ width, kernel: 'lanczos3' });
  await img.jpeg({ quality: 88 }).toFile(`${OUT}/${out}`);
  console.log('wrote', out);
}

// A01 – Hero. Centre tile of video frame 01 (~896×560, ≈16:10).
// Header, lockup and CTA are baked into the frame, so those areas are blurred.
await crop(
  'reference/video-frames/01-hero.jpg',
  { left: 372, top: 372, width: 896, height: 560 },
  'hero.jpg',
  {
    blurBoxes: [
      { left: 0, top: 0, width: 896, height: 32 },
      { left: 300, top: 176, width: 312, height: 236 },
      { left: 350, top: 506, width: 200, height: 42 },
    ],
  },
);
