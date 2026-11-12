// Contact sheet: each file scaled to a fixed width, cropped to a max height, side by side.
import sharp from 'sharp';
const [,, out, W, H, ...files] = process.argv; const w = +W, maxH = +H; const parts = []; let x = 0;
for (const f of files) {
  let img = sharp(f).resize({ width: w });
  const b = await img.toBuffer({ resolveWithObject: true });
  const h = Math.min(b.info.height, maxH);
  const c = await sharp(b.data).extract({ left: 0, top: 0, width: w, height: h }).toBuffer();
  parts.push({ input: c, left: x, top: 0 }); x += w + 10;
}
await sharp({ create: { width: x, height: maxH, channels: 3, background: '#0a0' } }).composite(parts).png().toFile(out);
