import sharp from 'sharp';
const [,, out, ...files] = process.argv; const H = 260; const parts = []; let x = 0;
for (const f of files) { const b = await sharp(f).resize({ height: H }).toBuffer({ resolveWithObject: true }); parts.push({ input: b.data, left: x, top: 0 }); x += b.info.width + 8; }
await sharp({ create: { width: x, height: H, channels: 3, background: '#0a0' } }).composite(parts).png().toFile(out);
