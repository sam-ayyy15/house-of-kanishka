// Traces the brand emblem (reference/images/emblem.png) into SVG paths, one per petal, and
// writes them to components/emblem-paths.ts.
//
//   node scripts/make-emblem.mjs
//
// The lotus is line art: every petal is an outline, and the outlines touch, so the whole drawing
// is one connected line. To animate it petal by petal it is split up like this:
//   1. The enclosed white spaces are found; each belongs to one petal (PETALS below says which,
//      by a point inside it). Some petals have two or three spaces (a fold line inside them).
//   2. Every inked pixel is given to a petal: of the petals whose spaces lie within a line's
//      width of it, the one nearest the front. So a line between two petals belongs to the one
//      in front, as it does in the drawing.
//   3. Each petal's ink is traced around all its edges (outside and inside), so a petal is a
//      ring with its interior left open. Outlines run one way and holes the other, so the paths
//      fill correctly with either fill rule.
// Put back together, the petals are exactly the original drawing.
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const SRC = 'reference/images/emblem.png';
const INK = 128; // darker than this is ink
const BLUR = 1.1; // softens the scan's pixel steps before thresholding
const REACH = 15; // a line belongs to a petal whose space is within this many px (lines are ~10-12 px)
const EPSILON = 2.2; // simplification tolerance, source px (the drawing is shown at 200 px or less, where this is a fraction of a pixel)
const PAD = 4;

/**
 * The petals, front to back (the order decides who owns a shared line), with a point inside each of
 * their spaces, in source pixels, and their place in the bloom: the heart and the low petals open
 * first, then the flower opens ring by ring up to the top petal.
 */
const PETALS = [
  { name: 'bud', step: 0, seeds: [[755, 587], [660, 605], [850, 605]] },
  { name: 'bottom-left', step: 0, seeds: [[521, 829], [577, 882]] },
  { name: 'bottom-right', step: 0, seeds: [[989, 830], [931, 883]] },
  { name: 'middle-left', step: 1, seeds: [[465, 601], [543, 569]] },
  { name: 'middle-right', step: 1, seeds: [[1047, 601], [967, 570]] },
  { name: 'outer-left', step: 2, seeds: [[372, 687]] },
  { name: 'outer-right', step: 2, seeds: [[1140, 687]] },
  { name: 'top', step: 3, seeds: [[755, 250]] },
  { name: 'back-left', step: 3, seeds: [[552, 395]] },
  { name: 'back-right', step: 3, seeds: [[957, 395]] },
];
/** Where the petals meet: the bloom grows from here. */
const HEART = [755, 795];
/**
 * Ink that belongs to a petal although it lies farther than REACH from that petal's spaces: the
 * pointed tip of the bud sits inside the top petal's space, but it is the end of the bud's outline.
 */
const CLAIMS = [{ petal: 'bud', at: [755, 340], radius: 30 }];

const { data, info } = await sharp(SRC).flatten({ background: '#ffffff' }).greyscale().blur(BLUR).raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
const ink = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) ink[i] = data[i] < INK ? 1 : 0;

// ---------- 1. The enclosed white spaces ----------
const space = new Int32Array(W * H); // label of the white space a pixel is in (0 = ink)
const touchesEdge = [false];
for (let s = 0, n = 0; s < W * H; s++) {
  if (ink[s] || space[s]) continue;
  const id = ++n;
  touchesEdge[id] = false;
  const stack = [s];
  space[s] = id;
  while (stack.length) {
    const p = stack.pop();
    const x = p % W, y = (p / W) | 0;
    if (x === 0 || y === 0 || x === W - 1 || y === H - 1) touchesEdge[id] = true;
    for (const q of [p - W, p + W, x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1]) {
      if (q < 0 || q >= W * H || ink[q] || space[q]) continue;
      space[q] = id;
      stack.push(q);
    }
  }
}
const petalOfSpace = new Map();
PETALS.forEach((petal, pi) => {
  for (const [x, y] of petal.seeds) {
    const id = space[y * W + x];
    if (!id || touchesEdge[id]) throw new Error(`${petal.name}: seed ${x},${y} is not inside an enclosed space`);
    petalOfSpace.set(id, pi);
  }
});

// ---------- 2. Give every inked pixel to a petal ----------
// Distance (through ink only) from each petal's spaces, up to a little past a line's width.
const FAR = 255;
const dist = PETALS.map(() => new Uint8Array(W * H).fill(FAR));
PETALS.forEach((_, pi) => {
  const d = dist[pi];
  let frontier = [];
  for (let p = 0; p < W * H; p++) if (space[p] && petalOfSpace.get(space[p]) === pi) frontier.push(p);
  for (let step = 1; step <= 60 && frontier.length; step++) {
    const next = [];
    for (const p of frontier) {
      const x = p % W;
      for (const q of [p - W, p + W, x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p - W - 1, p - W + 1, p + W - 1, p + W + 1]) {
        if (q < 0 || q >= W * H || !ink[q] || d[q] <= step) continue;
        d[q] = step;
        next.push(q);
      }
    }
    frontier = next;
  }
});
const owner = new Int8Array(W * H).fill(-1);
let orphans = 0;
const claimed = (p) => {
  const x = p % W, y = (p / W) | 0;
  const c = CLAIMS.find((c) => Math.hypot(x - c.at[0], y - c.at[1]) <= c.radius);
  return c ? PETALS.findIndex((pt) => pt.name === c.petal) : -1;
};
for (let p = 0; p < W * H; p++) {
  if (!ink[p]) continue;
  let best = claimed(p);
  if (best >= 0) { owner[p] = best; continue; }
  for (let pi = 0; pi < PETALS.length; pi++) if (dist[pi][p] <= REACH) { best = pi; break; } // front-most within reach
  if (best < 0) {
    let near = FAR;
    for (let pi = 0; pi < PETALS.length; pi++) if (dist[pi][p] < near) { near = dist[pi][p]; best = pi; }
  }
  if (best < 0) orphans++;
  owner[p] = best;
}

// ---------- 2b. Clean each petal's shape ----------
// Slivers one or two pixels wide (where the scan's edge steps, or where two petals' ink meets at a
// point) would trace as needles that double back on themselves: invisible when filled, but drawn as
// stray hairlines by the fine outline the site adds to the lotus. An opening (erode, then dilate, by
// one pixel) removes anything under three pixels wide and leaves the ~11 px lines untouched. A pixel
// a petal loses goes to the neighbouring petal that surrounds it most, so no seam opens between them.
{
  const N8 = [-W - 1, -W, -W + 1, -1, 1, W - 1, W, W + 1];
  const inside = (p, pi) => owner[p] === pi;
  const kept = new Int8Array(W * H).fill(-1);
  for (let pi = 0; pi < PETALS.length; pi++) {
    const eroded = new Uint8Array(W * H);
    for (let p = W; p < W * H - W; p++) if (inside(p, pi) && N8.every((d) => inside(p + d, pi))) eroded[p] = 1;
    for (let p = W; p < W * H - W; p++) if (inside(p, pi) && (eroded[p] || N8.some((d) => eroded[p + d]))) kept[p] = pi;
  }
  let moved = 0, dropped = 0;
  for (let p = W; p < W * H - W; p++) {
    if (owner[p] < 0 || kept[p] >= 0) continue;
    const votes = new Map();
    for (const d of N8) if (kept[p + d] >= 0) votes.set(kept[p + d], (votes.get(kept[p + d]) ?? 0) + 1);
    let best = -1, most = 2; // at least 3 of 8 neighbours, or it is a stray speck
    for (const [pi, n] of votes) if (n > most) { most = n; best = pi; }
    if (best >= 0) { kept[p] = best; moved++; } else dropped++;
  }
  owner.set(kept);
  console.log(`cleanup: ${moved} sliver pixels given to a neighbouring petal, ${dropped} stray pixels dropped`);
}

// ---------- 3. Trace each petal around all its edges ----------
// Pixel-edge contours, each edge oriented clockwise around its own pixel (y down), so outlines come
// out clockwise and holes anticlockwise.
function contours(belongs) {
  const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H && belongs(y * W + x);
  const next = new Map(); // "x,y" -> [end vertex, ...]
  const add = (ax, ay, bx, by) => {
    const k = ax + ',' + ay;
    (next.get(k) ?? next.set(k, []).get(k)).push([bx, by]);
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!inside(x, y)) continue;
    if (!inside(x, y - 1)) add(x, y, x + 1, y);
    if (!inside(x + 1, y)) add(x + 1, y, x + 1, y + 1);
    if (!inside(x, y + 1)) add(x + 1, y + 1, x, y + 1);
    if (!inside(x - 1, y)) add(x, y + 1, x, y);
  }
  const loops = [];
  for (const [startKey, outs] of next) {
    while (outs.length) {
      const [sx, sy] = startKey.split(',').map(Number);
      const pts = [[sx, sy]];
      let [px, py] = [sx, sy];
      let [cx, cy] = outs.pop();
      for (let guard = 0; guard < 1e6 && !(cx === sx && cy === sy); guard++) {
        pts.push([cx, cy]);
        const cand = next.get(cx + ',' + cy);
        // Where two edges leave one corner (pixels touching only diagonally), turn right: the
        // diagonal neighbours stay separate, as with 4-connected regions.
        let pick = 0;
        if (cand.length > 1) {
          const dx = cx - px, dy = cy - py;
          pick = cand.findIndex(([nx, ny]) => (nx - cx) === -dy && (ny - cy) === dx);
          if (pick < 0) pick = 0;
        }
        const [nx, ny] = cand.splice(pick, 1)[0];
        [px, py, cx, cy] = [cx, cy, nx, ny];
      }
      if (pts.length > 8) loops.push(pts);
    }
  }
  return loops;
}

// Ramer–Douglas–Peucker on a closed outline.
function simplify(pts, eps) {
  const keep = new Uint8Array(pts.length);
  const rdp = (a, b) => {
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    let far = -1, dmax = 0;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0]) * (by - ay)) / len;
      if (d > dmax) { dmax = d; far = i; }
    }
    if (dmax > eps) { keep[far] = 1; rdp(a, far); rdp(far, b); }
  };
  const half = pts.length >> 1;
  keep[0] = keep[half] = keep[pts.length - 1] = 1;
  rdp(0, half);
  rdp(half, pts.length - 1);
  return pts.filter((_, i) => keep[i]);
}

// Crop to the ink.
let minX = W, minY = H, maxX = 0, maxY = 0;
for (let p = 0; p < W * H; p++) if (owner[p] >= 0) { const x = p % W, y = (p / W) | 0; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
const ox = minX - PAD, oy = minY - PAD;
const vw = maxX - minX + 1 + PAD * 2, vh = maxY - minY + 1 + PAD * 2;
const f = (n) => Math.round(n).toString();

// Smooth closed curve through the points (Catmull-Rom → cubic Bézier); sharp corners stay sharp.
function toPath(pts) {
  // Points closer than 1.5 px are merged: across such a tiny step a smoothing handle would be aimed
  // by the neighbours and overshoot (that is what drew needles off the petal tips).
  const p = [];
  for (const [x, y] of pts) {
    const q = [x - ox, y - oy];
    const last = p[p.length - 1];
    if (!last || Math.hypot(q[0] - last[0], q[1] - last[1]) >= 1.5) p.push(q);
  }
  if (p.length > 2 && Math.hypot(p[0][0] - p.at(-1)[0], p[0][1] - p.at(-1)[1]) < 1.5) p.pop();
  const n = p.length;
  let d = `M${f(p[0][0])} ${f(p[0][1])}`;
  const turn = (a, b) => Math.abs(((b - a + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
  // A handle never reaches farther than 40 % of its own segment, so a curve can't overshoot its ends.
  const handle = (from, dx, dy, seg) => {
    const len = Math.hypot(dx, dy);
    const k = len > seg * 0.4 * 6 ? (seg * 0.4) / len : 1 / 6;
    return [from[0] + dx * k, from[1] + dy * k];
  };
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
    const a1 = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]), a2 = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]), a3 = Math.atan2(p3[1] - p2[1], p3[0] - p2[0]);
    const seg = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    // Sharp corners (petal tips) stay sharp: no smoothing across a turn tighter than ~60°.
    const c1 = turn(a1, a2) > 1.05 ? p1 : handle(p1, p2[0] - p0[0], p2[1] - p0[1], seg);
    const c2 = turn(a2, a3) > 1.05 ? p2 : handle(p2, -(p3[0] - p1[0]), -(p3[1] - p1[1]), seg);
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + 'Z';
}

const out = PETALS.map((petal, pi) => {
  const area = (l) => Math.abs(l.reduce((sum, [x, y], i) => { const [nx, ny] = l[(i + 1) % l.length]; return sum + x * ny - nx * y; }, 0) / 2);
  // Loops enclosing almost nothing (under 40 px²) are specks or needles, not part of the drawing.
  const loops = contours((p) => owner[p] === pi).filter((l) => area(l) >= 40).map((l) => simplify(l, EPSILON)).filter((l) => l.length > 3);
  return { name: petal.name, step: petal.step, d: loops.map(toPath).join(''), loops: loops.length };
}).sort((a, b) => a.step - b.step);

const origin = `${f(((HEART[0] - ox) / vw) * 100)}% ${f(((HEART[1] - oy) / vh) * 100)}%`;
writeFileSync(
  'components/emblem-paths.ts',
  `// Written by scripts/make-emblem.mjs from reference/images/emblem.png. Do not edit by hand.\n` +
    `export const EMBLEM_VIEWBOX = '0 0 ${vw} ${vh}';\n\n` +
    `/** Where the petals meet, as a transform-origin: the bloom grows from here. */\n` +
    `export const EMBLEM_ORIGIN = '${origin}';\n\n` +
    `/**\n * One path per petal, heart first; \`step\` is its ring in the bloom. Each petal is an outline (a ring\n * with its inside open): outlines are wound one way and holes the other, so any fill rule works.\n */\n` +
    `export const EMBLEM_PETALS: { name: string; d: string; step: number }[] = [\n` +
    out.map((s) => `  { name: '${s.name}', step: ${s.step}, d: '${s.d}' },`).join('\n') +
    `\n];\n`,
);
console.log(`${out.length} petals (${out.map((o) => `${o.name}:${o.loops}`).join(', ')}), ${out.at(-1).step + 1} bloom steps, viewBox ${vw}x${vh}, origin ${origin}, unassigned ink px: ${orphans}`);
