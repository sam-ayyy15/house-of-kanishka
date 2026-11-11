// Side-by-side: reference crop (left) vs screenshot (right), both scaled to the same height.
// Usage: node scripts/compare.mjs <ref> <x,y,w,h> <shot> <out> [height=600]
import sharp from 'sharp';
const [,, ref, box, shot, out, hArg] = process.argv;
const [left, top, width, height] = box.split(',').map(Number);
const H = Number(hArg ?? 600);
const a = await sharp(ref).extract({ left, top, width, height }).resize({ height: H }).toBuffer({ resolveWithObject: true });
const b = await sharp(shot).resize({ height: H }).toBuffer({ resolveWithObject: true });
const gap = 16;
await sharp({ create: { width: a.info.width + b.info.width + gap, height: H, channels: 3, background: '#888' } })
  .composite([{ input: a.data, left: 0, top: 0 }, { input: b.data, left: a.info.width + gap, top: 0 }])
  .png().toFile(out);
console.log('wrote', out);
