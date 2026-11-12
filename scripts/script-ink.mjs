// Red-script ink bounding box, normalised to the photo box (0..1 = photo edges).
// Usage: node scripts/script-ink.mjs <image> <photoX,photoY,photoW,photoH>
import sharp from 'sharp';
const [,, file, box] = process.argv;
const [px, py, pw, ph] = box.split(',').map(Number);
const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
let minX = 1e9, maxX = -1, minY = 1e9, maxY = -1;
const cols = new Map();
// Only look around the photo's lower half, where the script sits.
const x0 = Math.max(0, Math.round(px - 0.45 * pw)), x1 = Math.min(info.width, Math.round(px + 1.5 * pw));
const y0 = Math.max(0, Math.round(py + 0.4 * ph)), y1 = Math.min(info.height, Math.round(py + 1.55 * ph));
for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
  const i = (y * info.width + x) * 3, r = data[i], g = data[i + 1], b = data[i + 2];
  if (r > 120 && g < 60 && b < 60 && r - g > 90) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    if (!cols.has(x)) cols.set(x, []); cols.get(x).push(y);
  }
}
const n = (v, o, s) => +((v - o) / s).toFixed(3);
// Angle: lowest ink along the left and right fifths (rough baseline slope).
const xs = [...cols.keys()].sort((a, b) => a - b);
const band = (from, to) => { const ys = xs.filter((x) => x >= from && x <= to).map((x) => Math.max(...cols.get(x))); ys.sort((a, b) => a - b); return ys[Math.floor(ys.length / 2)]; };
const w = maxX - minX;
const yl = band(minX + w * 0.55, minX + w * 0.7), yr = band(minX + w * 0.85, maxX);
const angle = Math.atan2(yr - yl, (minX + w * 0.92) - (minX + w * 0.62)) * 180 / Math.PI;
console.log(JSON.stringify({ left: n(minX, px, pw), right: n(maxX, px, pw), top: n(minY, py, ph), bottom: n(maxY, py, ph), angle: +angle.toFixed(1) }));
