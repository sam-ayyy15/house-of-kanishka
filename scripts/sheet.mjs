import sharp from 'sharp';
// args: out then src|x,y,w,h ...
const [,, out, ...items] = process.argv;
const H = 300; const parts = [];
let x = 0;
for (const it of items) {
  const [src, box] = it.split('|');
  const [left, top, width, height] = box.split(',').map(Number);
  const b = await sharp(src).extract({ left, top, width, height }).resize({ height: H }).toBuffer({ resolveWithObject: true });
  parts.push({ input: b.data, left: x, top: 0 }); x += b.info.width + 10;
}
await sharp({ create: { width: x, height: H, channels: 3, background: '#0a0' } }).composite(parts).png().toFile(out);
