// Finds the centre tile edges in a reel frame by scanning for the red gutter colour.
import sharp from 'sharp';
const isGutter = (r, g, b) => Math.abs(r - 162) < 28 && g < 40 && b < 45;
for (const f of process.argv.slice(2)) {
  const { data, info } = await sharp(f).raw().toBuffer({ resolveWithObject: true });
  const px = (x, y) => { const i = (y * info.width + x) * info.channels; return [data[i], data[i + 1], data[i + 2]]; };
  const run = (fixed, horizontal, from, step) => {
    // walk from centre outwards until we hit a run of 6 gutter pixels
    let n = 0;
    for (let p = from; p > 0 && p < (horizontal ? info.width : info.height); p += step) {
      const c = horizontal ? px(p, fixed) : px(fixed, p);
      n = isGutter(...c) ? n + 1 : 0;
      if (n >= 6) return p - step * 5;
    }
    return null;
  };
  const out = {};
  for (const [cx, cy] of [[800, 600], [600, 600], [1000, 600]]) {
    out[`row y=${cy} from x=${cx}`] = [run(cy, true, cx, -1), run(cy, true, cx, 1)];
  }
  for (const cx of [550, 800, 1050]) out[`col x=${cx}`] = [run(cx, false, 600, -1), run(cx, false, 600, 1)];
  console.log(f.split('/').pop(), JSON.stringify(out));
}
