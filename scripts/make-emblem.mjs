// Traces the brand emblem (reference/images/emblem.png) into SVG paths, one per petal, and
// writes them to components/emblem-paths.ts. The source has a transparency checkerboard
// baked into its pixels, so only the dark ink is kept.
//
//   node scripts/make-emblem.mjs
//
// Each petal is a separate shape in the drawing, so each becomes its own path and can be
// animated on its own. Paths are ordered from the centre outwards (the order they bloom in).
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const SRC = 'reference/images/emblem.png';
const INK = 128; // luminance below this is ink; the checkerboard is all above 190
const MIN_AREA = 400; // drop specks
const EPSILON = 1.5; // simplification tolerance, source px

const { data, info } = await sharp(SRC).greyscale().blur(1.4).raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
const ink = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) ink[i] = data[i] < INK ? 1 : 0;

// ---------- Connected shapes (8-neighbour flood fill) ----------
const label = new Int32Array(W * H);
const shapes = [];
for (let start = 0; start < W * H; start++) {
  if (!ink[start] || label[start]) continue;
  const id = shapes.length + 1;
  const stack = [start];
  label[start] = id;
  let area = 0, sx = 0, sy = 0, minX = W, minY = H, maxX = 0, maxY = 0;
  while (stack.length) {
    const p = stack.pop();
    const x = p % W, y = (p / W) | 0;
    area++; sx += x; sy += y;
    if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const q = ny * W + nx;
      if (ink[q] && !label[q]) { label[q] = id; stack.push(q); }
    }
  }
  shapes.push({ id, area, cx: sx / area, cy: sy / area, minX, minY, maxX, maxY, start });
}
const petals = shapes.filter((s) => s.area >= MIN_AREA);

// ---------- Outline of one shape (Moore-neighbour tracing) ----------
function trace(id, start) {
  const at = (x, y) => x >= 0 && y >= 0 && x < W && y < H && label[y * W + x] === id;
  // Clockwise neighbours, starting west.
  const N = [[-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1]];
  const sx = start % W, sy = (start / W) | 0; // topmost-leftmost pixel (scan order)
  const pts = [[sx, sy]];
  let x = sx, y = sy, dir = 0; // we entered from the west
  for (let guard = 0; guard < 1e6; guard++) {
    let found = false;
    for (let k = 0; k < 8; k++) {
      const d = (dir + k) % 8;
      const nx = x + N[d][0], ny = y + N[d][1];
      if (at(nx, ny)) {
        x = nx; y = ny;
        dir = (d + 6) % 8; // back up two steps, so the search hugs the outside
        found = true;
        break;
      }
    }
    if (!found || (x === sx && y === sy)) break;
    pts.push([x, y]);
  }
  return pts;
}

// Ramer–Douglas–Peucker on a closed outline.
function simplify(pts, eps) {
  const keep = new Uint8Array(pts.length);
  const rdp = (a, b) => {
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    let far = -1, dist = 0;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0]) * (by - ay)) / len;
      if (d > dist) { dist = d; far = i; }
    }
    if (dist > eps) { keep[far] = 1; rdp(a, far); rdp(far, b); }
  };
  const half = pts.length >> 1;
  keep[0] = keep[half] = keep[pts.length - 1] = 1;
  rdp(0, half);
  rdp(half, pts.length - 1);
  return pts.filter((_, i) => keep[i]);
}

// Smooth closed curve through the points (Catmull-Rom → cubic Bézier), coordinates in the
// final viewBox (cropped to the ink, 1 decimal).
const PAD = 4;
const box = petals.reduce((b, s) => ({ minX: Math.min(b.minX, s.minX), minY: Math.min(b.minY, s.minY), maxX: Math.max(b.maxX, s.maxX), maxY: Math.max(b.maxY, s.maxY) }), { minX: W, minY: H, maxX: 0, maxY: 0 });
const ox = box.minX - PAD, oy = box.minY - PAD;
const vw = box.maxX - box.minX + PAD * 2, vh = box.maxY - box.minY + PAD * 2;
const f = (n) => (Math.round(n * 10) / 10).toString();

function toPath(pts) {
  const p = pts.map(([x, y]) => [x + 0.5 - ox, y + 0.5 - oy]);
  const n = p.length;
  let d = `M${f(p[0][0])} ${f(p[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
    // Corners (sharp petal tips) stay sharp: no smoothing across a turn tighter than ~60°.
    const a1 = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]), a2 = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]), a3 = Math.atan2(p3[1] - p2[1], p3[0] - p2[0]);
    const turn = (a, b) => Math.abs(((b - a + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
    const t1 = turn(a1, a2) > 1.05 ? 0 : 1 / 6, t2 = turn(a2, a3) > 1.05 ? 0 : 1 / 6;
    const c1 = [p1[0] + (p2[0] - p0[0]) * t1, p1[1] + (p2[1] - p0[1]) * t1];
    const c2 = [p2[0] - (p3[0] - p1[0]) * t2, p2[1] - (p3[1] - p1[1]) * t2];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + 'Z';
}

// Bloom order: from the centre petal outwards, left and right together.
const centreX = (box.minX + box.maxX) / 2, baseY = box.maxY;
const out = petals
  .map((s) => ({ d: toPath(simplify(trace(s.id, s.start), EPSILON)), reach: Math.hypot((s.cx - centreX) * 0.8, s.cy - baseY * 0.9), cx: s.cx }))
  .sort((a, b) => a.reach - b.reach || a.cx - b.cx);

const steps = [];
for (const p of out) {
  // Mirror pairs share a step.
  const prev = steps.at(-1);
  steps.push(prev && Math.abs(prev.reach - p.reach) < 30 ? { ...p, step: prev.step } : { ...p, step: (prev?.step ?? -1) + 1 });
}

writeFileSync(
  'components/emblem-paths.ts',
  `// Written by scripts/make-emblem.mjs from reference/images/emblem.png. Do not edit by hand.\n` +
    `export const EMBLEM_VIEWBOX = '0 0 ${vw} ${vh}';\n\n` +
    `/** One path per petal, centre first; \`step\` is its place in the bloom. */\n` +
    `export const EMBLEM_PETALS: { d: string; step: number }[] = [\n` +
    steps.map((s) => `  { step: ${s.step}, d: '${s.d}' },`).join('\n') +
    `\n];\n`,
);
console.log(`${steps.length} petals, ${steps.at(-1).step + 1} bloom steps, viewBox ${vw}x${vh}, ${shapes.length - petals.length} specks dropped`);
