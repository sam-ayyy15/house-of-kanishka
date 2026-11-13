// Turns the client's model shots in reference/images/ into card images on plain white, the
// same treatment as the other cut-outs (spec §11). The source files carry a transparency
// checkerboard baked into their pixels, so the background is found by flood-filling in from
// the edges through near-white, colourless pixels only: the figure's skin and fabric (even
// ivory satin) are warmer than that and stop the fill. Then each is cropped to the figure.
//
//   node scripts/make-model-cutouts.mjs
import sharp from 'sharp';

const JOBS = [
  ['Burgundy Satin Halter Dress Model.png', 'model-burgundy-satin-halter.jpg'],
  ['Ivory Satin Halter Gown Portrait.png', 'model-ivory-satin-gown.jpg'],
  ['Burgundy Velvet Gown with Thigh Slit.png', 'model-burgundy-velvet-gown.jpg'],
];
const BRIGHT = 200; // background pixels are at least this light…
const GREY = 12; // …and their channels differ by no more than this
// Framing matched to the other model cut-outs: a little headroom (so the card's hover zoom
// never reaches the head), a little floor, and a ~0.30 portrait canvas.
const TOP = 0.04, BOTTOM = 0.02, RATIO = 0.3;

for (const [src, out] of JOBS) {
  const { data, info } = await sharp(`reference/images/${src}`).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const isBg = (i) => {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
    return Math.min(r, g, b) >= BRIGHT && Math.max(r, g, b) - Math.min(r, g, b) <= GREY;
  };
  // Light, colourless pixels grouped into connected patches. A patch is background if it
  // touches the edge, or if it is enclosed (between the legs, inside an arm) but carries the
  // checkerboard's two tones: plenty of both its grey squares and its white squares.
  const cand = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) cand[p] = isBg(p) ? 1 : 0;
  const bg = new Uint8Array(W * H);
  const seen = new Uint8Array(W * H);
  for (let s0 = 0; s0 < W * H; s0++) {
    if (!cand[s0] || seen[s0]) continue;
    const patch = [];
    const stack = [s0];
    seen[s0] = 1;
    let edge = false, greys = 0, whites = 0;
    while (stack.length) {
      const p = stack.pop();
      patch.push(p);
      const x = p % W, y = (p / W) | 0;
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) edge = true;
      const v = data[p * 3];
      if (v >= 205 && v <= 240) greys++;
      else if (v >= 248) whites++;
      for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1]) {
        if (q >= 0 && cand[q] && !seen[q]) { seen[q] = 1; stack.push(q); }
      }
    }
    if (edge || (greys > 300 && whites > 300)) for (const p of patch) bg[p] = 1;
  }

  // The figure: the biggest connected shape that isn't background (plus any piece at least
  // 1 % of its size, e.g. a foot), so stray specks in the margin don't widen the crop.
  const comp = new Int32Array(W * H);
  const sizes = [0];
  for (let s0 = 0; s0 < W * H; s0++) {
    if (bg[s0] || comp[s0]) continue;
    const id = sizes.length;
    let n = 0;
    const stack = [s0];
    comp[s0] = id;
    while (stack.length) {
      const p = stack.pop();
      n++;
      const x = p % W, y = (p / W) | 0;
      for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1]) {
        if (q >= 0 && !bg[q] && !comp[q]) { comp[q] = id; stack.push(q); }
      }
    }
    sizes.push(n);
  }
  const biggest = Math.max(...sizes);
  const keep = sizes.map((n) => n >= biggest * 0.01);
  for (let p = 0; p < W * H; p++) if (!bg[p] && !keep[comp[p]]) bg[p] = 1;

  // Background → white. Pixels touching the background are blended halfway, which softens
  // the cut edge the way an anti-aliased cut-out would look.
  let minX = W, minY = H, maxX = 0, maxY = 0;
  const outBuf = Buffer.from(data);
  for (let p = 0; p < W * H; p++) {
    const x = p % W, y = (p / W) | 0;
    if (bg[p]) {
      outBuf[p * 3] = outBuf[p * 3 + 1] = outBuf[p * 3 + 2] = 255;
      continue;
    }
    if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
    const edge = (x > 0 && bg[p - 1]) || (x < W - 1 && bg[p + 1]) || (y > 0 && bg[p - W]) || (y < H - 1 && bg[p + W]);
    if (edge) for (let c = 0; c < 3; c++) outBuf[p * 3 + c] = Math.round((outBuf[p * 3 + c] + 255) / 2);
  }

  const figW = maxX - minX + 1, figH = maxY - minY + 1;
  const height = Math.round(figH / (1 - TOP - BOTTOM));
  const width = Math.max(figW + 8, Math.round(height * RATIO));
  const figure = await sharp(outBuf, { raw: { width: W, height: H, channels: 3 } })
    .extract({ left: minX, top: minY, width: figW, height: figH })
    .png()
    .toBuffer();
  // The figure centred on a white canvas, its feet the set distance from the bottom.
  await sharp({ create: { width, height, channels: 3, background: '#ffffff' } })
    .composite([{ input: figure, left: Math.round((width - figW) / 2), top: Math.round(height * TOP) }])
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(`public/placeholders/${out}`);
  console.log(`${out}: ${width}x${height} (ratio ${(width / height).toFixed(3)})`);
}
