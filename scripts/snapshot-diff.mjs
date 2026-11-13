// Compares two folders of static snapshots. Usage: node scripts/snapshot-diff.mjs <before> <after> [filter]
import sharp from 'sharp';
import { readdirSync, mkdirSync } from 'node:fs';
const [,, A, B, filter] = process.argv;
mkdirSync('.shots/diff', { recursive: true });
for (const f of readdirSync(A).filter((f) => f.endsWith('.png') && (!filter || f.includes(filter))).sort()) {
  let a, b;
  try {
    a = await sharp(`${A}/${f}`).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    b = await sharp(`${B}/${f}`).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  } catch { console.log(f.padEnd(52), 'MISSING in after'); continue; }
  if (a.info.width !== b.info.width || a.info.height !== b.info.height) {
    console.log(f.padEnd(52), `SIZE ${a.info.width}x${a.info.height} → ${b.info.width}x${b.info.height}`);
    continue;
  }
  const W = a.info.width, H = a.info.height;
  let n = 0, x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
  const out = Buffer.alloc(W * H * 3);
  for (let i = 0; i < W * H; i++) {
    // Compare brightness, not colour: headless Chrome switches between grey and sub-pixel
    // (colour-fringed) text smoothing depending on layering, which is not a layout change.
    const la = a.data[i * 3] * 0.3 + a.data[i * 3 + 1] * 0.59 + a.data[i * 3 + 2] * 0.11;
    const lb = b.data[i * 3] * 0.3 + b.data[i * 3 + 1] * 0.59 + b.data[i * 3 + 2] * 0.11;
    const d = Math.abs(la - lb);
    const g = 255 - (255 - (b.data[i * 3] + b.data[i * 3 + 1] + b.data[i * 3 + 2]) / 3) * 0.3;
    if (d > 56) { n++; const x = i % W, y = (i / W) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); out[i * 3] = 255; out[i * 3 + 1] = 0; out[i * 3 + 2] = 160; }
    else { out[i * 3] = out[i * 3 + 1] = out[i * 3 + 2] = g; }
  }
  const pct = (n / (W * H) * 100).toFixed(3);
  console.log(f.padEnd(52), `${pct}% differ`, n ? `box x ${x0}-${x1}, y ${y0}-${y1}` : '');
  if (n / (W * H) > 0.0005) await sharp(out, { raw: { width: W, height: H, channels: 3 } }).png().toFile(`.shots/diff/${f}`);
}
