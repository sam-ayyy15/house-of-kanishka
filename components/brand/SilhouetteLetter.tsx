'use client';

import { clearCache, layoutNextLine, prepareWithSegments, type LayoutCursor, type PreparedTextWithSegments } from '@chenglou/pretext';
import { useEffect, useRef } from 'react';
import { Handwriting } from '../Handwriting';
import styles from './SilhouetteLetter.module.css';

/**
 * The Brand: a letter set around a dress, on water. EXTRAPOLATED – no reference design
 * (client request: a typographic piece built on Pretext, in the site's visual language).
 *
 * - The outline of the inline SVG silhouette is read from its own path, and the letter is
 *   typeset line by line against it: two columns whose inner edges follow the dress.
 * - The text is drawn on a canvas that behaves like a pool. Moving the pointer or clicking
 *   sends ripples across it: they lift and shift the letters, bounce off the dress, and
 *   nudge the edge the text wraps to, so the lines re-set as a wave passes. The dress
 *   itself never moves with the water.
 * - The dress can be dragged sideways (or moved with the arrow keys); the text re-sets
 *   around it on every frame.
 *
 * Pretext does all line breaking as plain arithmetic, so nothing is measured in the page
 * while this runs. Without JS the same text shows as two plain columns either side of the
 * dress. Screen readers always get the plain paragraphs. With reduced motion there are no
 * ripples; dragging still works.
 */

// Placeholder copy in the brand's voice (same status as the notes above it on this page).
const LETTER = [
  'We begin with a woman walking. She is crossing a room, a street, a morning, and everything the house makes is cut around that movement and around the space she leaves behind her as she goes.',
  'So the cloth is chosen for how it falls rather than how it photographs. Satin that follows a step and settles half a second late. Crepe that holds its line through a long day. A halter that leaves the shoulders free, a waist that sits clean without being held.',
  'We keep the collections small because attention is finite. A dress is fitted, worn, altered and fitted again before it earns its place, and what does not earn it is left out. There is one red, and it runs from the set to the stitching.',
  'What remains is quiet on purpose. These are pieces that make room for the person inside them, easy to live in and hard to date. Wear them your way, and often. That has been the whole idea since the first pattern we cut.',
];

const PROFILE_ROWS = 280;
const PAD = 28; // canvas bleed around the stage, so displaced letters aren't clipped
const CELL = 10; // water grid cell, px
const DAMPING = 0.972; // how quickly ripples die away
const LIFT = 7; // px a letter shifts per unit of water slope
const PUSH = 12; // px the wrap edge moves per unit of water height

/** Per row of the silhouette, where it starts and ends (0…1 of its width). */
type Profile = { left: Float32Array; right: Float32Array };

function readProfile(svg: SVGSVGElement): Profile {
  const box = svg.viewBox.baseVal;
  const rows = PROFILE_ROWS;
  const cols = Math.max(48, Math.round((rows * box.width) / box.height));
  const canvas = document.createElement('canvas');
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.scale(cols / box.width, rows / box.height);
  ctx.translate(-box.x, -box.y);
  for (const path of svg.querySelectorAll('path')) {
    ctx.fill(new Path2D(path.getAttribute('d') ?? ''), path.getAttribute('fill-rule') === 'evenodd' ? 'evenodd' : 'nonzero');
  }
  const { data } = ctx.getImageData(0, 0, cols, rows);
  const ink = (x: number, y: number) => data[(y * cols + x) * 4 + 3] > 60;

  const left = new Float32Array(rows).fill(1);
  const right = new Float32Array(rows).fill(0);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (ink(x, y)) {
        left[y] = x / cols;
        break;
      }
    }
    for (let x = cols - 1; x >= 0; x--) {
      if (ink(x, y)) {
        right[y] = (x + 1) / cols;
        break;
      }
    }
  }
  return { left, right };
}

type Line = { text: string; x: number; y: number; spacing: number };

type Geometry = {
  width: number; // stage width
  height: number; // stage height
  figW: number;
  figH: number;
  fontSize: number;
  lineHeight: number;
  gap: number; // clear space between the dress and the text
  mobile: boolean;
  figY: number;
  textTop: number;
  rows: number; // lines per column at rest (desktop)
  restX: number; // the dress's resting x
  minX: number; // drag limits
  maxX: number;
};

type Word = { width: number; chars: string[]; offsets: number[] };

export function SilhouetteLetter({ figure, ratio }: { figure: React.ReactNode; ratio: number }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const figureRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const stage = stageRef.current!;
    const figure = figureRef.current!;
    const copy = copyRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let cancelled = false;
    let profile: Profile | null = null;
    let prepared: PreparedTextWithSegments[] = [];
    let font = '';
    let color = '#000';
    let geo: Geometry | null = null;
    let figX = 0;
    let frame = 0;
    let lastTime = 0;
    let dragging = false;
    let words = new Map<string, Word>();
    let spaceWidth = 0;
    let baseline = 0; // from the top of a line box to the text baseline
    let lastRows = 3; // column length found on the previous frame

    // ---------- Water: a height field on a coarse grid (two-buffer wave equation) ----------
    let wCols = 0;
    let wRows = 0;
    let water = new Float32Array(0);
    let waterPrev = new Float32Array(0);
    let solid = new Uint8Array(0); // cells under the dress: waves bounce off them
    let calm = true;

    function resizeWater(g: Geometry) {
      wCols = Math.ceil((g.width + PAD * 2) / CELL) + 3;
      wRows = Math.ceil((g.height + PAD * 2) / CELL) + 3;
      water = new Float32Array(wCols * wRows);
      waterPrev = new Float32Array(wCols * wRows);
      solid = new Uint8Array(wCols * wRows);
      calm = true;
    }

    function markSolid(g: Geometry) {
      solid.fill(0);
      for (let cy = 1; cy < wRows - 1; cy++) {
        const y = (cy - 1) * CELL - PAD + CELL / 2;
        const row = Math.floor(((y - g.figY) / g.figH) * PROFILE_ROWS);
        if (row < 0 || row >= PROFILE_ROWS || profile!.right[row] <= profile!.left[row]) continue;
        const x0 = Math.ceil((figX + profile!.left[row] * g.figW + PAD) / CELL) + 1;
        const x1 = Math.floor((figX + profile!.right[row] * g.figW + PAD) / CELL) + 1;
        for (let cx = Math.max(1, x0); cx <= Math.min(wCols - 2, x1); cx++) solid[cy * wCols + cx] = 1;
      }
    }

    /** One step of the waves. Returns the largest height left, to know when the pool is calm. */
    function stepWater() {
      let peak = 0;
      for (let cy = 1; cy < wRows - 1; cy++) {
        for (let i = cy * wCols + 1, end = cy * wCols + wCols - 1; i < end; i++) {
          if (solid[i]) {
            waterPrev[i] = 0;
            continue;
          }
          const v = ((water[i - 1] + water[i + 1] + water[i - wCols] + water[i + wCols]) * 0.5 - waterPrev[i]) * DAMPING;
          waterPrev[i] = v;
          if (v > peak) peak = v;
          else if (-v > peak) peak = -v;
        }
      }
      [water, waterPrev] = [waterPrev, water];
      return peak;
    }

    /** Drops a soft-edged disturbance at a point (stage px). */
    function drop(x: number, y: number, radius: number, strength: number) {
      if (still || !wCols) return;
      const cx = (x + PAD) / CELL + 1;
      const cy = (y + PAD) / CELL + 1;
      for (let j = Math.max(1, Math.floor(cy - radius)); j <= Math.min(wRows - 2, Math.ceil(cy + radius)); j++) {
        for (let i = Math.max(1, Math.floor(cx - radius)); i <= Math.min(wCols - 2, Math.ceil(cx + radius)); i++) {
          const d = Math.hypot(i - cx, j - cy) / radius;
          if (d < 1 && !solid[j * wCols + i]) water[j * wCols + i] -= strength * (0.5 + 0.5 * Math.cos(Math.PI * d));
        }
      }
      calm = false;
      wake();
    }

    /** Water height at a point (stage px), smoothed between cells. */
    function heightAt(x: number, y: number) {
      const fx = Math.min(wCols - 2.001, Math.max(0, (x + PAD) / CELL + 0.5));
      const fy = Math.min(wRows - 2.001, Math.max(0, (y + PAD) / CELL + 0.5));
      const ix = fx | 0;
      const iy = fy | 0;
      const tx = fx - ix;
      const ty = fy - iy;
      const i = iy * wCols + ix;
      return (
        (water[i] * (1 - tx) + water[i + 1] * tx) * (1 - ty) + (water[i + wCols] * (1 - tx) + water[i + wCols + 1] * tx) * ty
      );
    }

    // ---------- Typesetting ----------

    /** The dress's outer edges (stage px) across one line of text, or null if it isn't there. */
    function figureSpan(y: number, x: number, g: Geometry, wet: boolean): [number, number] | null {
      const t0 = (y - g.lineHeight * 0.15 - g.figY) / g.figH;
      const t1 = (y + g.lineHeight * 1.05 - g.figY) / g.figH;
      const r0 = Math.max(0, Math.floor(t0 * PROFILE_ROWS));
      const r1 = Math.min(PROFILE_ROWS - 1, Math.ceil(t1 * PROFILE_ROWS));
      let lo = 1;
      let hi = 0;
      for (let r = r0; r <= r1; r++) {
        if (profile!.left[r] < lo) lo = profile!.left[r];
        if (profile!.right[r] > hi) hi = profile!.right[r];
      }
      if (hi <= lo) return null;
      let l = x + lo * g.figW - g.gap;
      let r = x + hi * g.figW + g.gap;
      if (wet) {
        // A wave standing against the dress pushes the text off it; a trough lets it closer.
        const mid = y + g.lineHeight / 2;
        l -= Math.max(-g.gap * 0.6, Math.min(g.gap, heightAt(l, mid) * PUSH));
        r += Math.max(-g.gap * 0.6, Math.min(g.gap, heightAt(r, mid) * PUSH));
      }
      return [l, r];
    }

    /** Sets the whole letter against the dress at x. Returns the lines and whether it all fitted. */
    function flow(g: Geometry, x: number, rows: number, wet: boolean) {
      const lines: Line[] = [];
      const indent = Math.round(g.fontSize * 1.5);
      // Narrowest line worth setting; the phone column is short, so it accepts shorter lines.
      const minSlot = g.fontSize * (g.mobile ? 4.5 : 6);
      let para = 0;
      let cursor: LayoutCursor | undefined;

      const fill = (side: 'left' | 'right' | 'single', maxRows: number) => {
        for (let row = 0; row < maxRows && para < prepared.length; row++) {
          const y = g.textTop + row * g.lineHeight;
          const span = figureSpan(y, x, g, wet);
          let lineX = 0;
          let slot = g.width;
          if (side === 'single') {
            if (span) slot = Math.min(g.width, span[0]);
          } else {
            // Where the dress isn't (above the head, below the hem) the columns keep a plain gutter.
            const mid = x + g.figW / 2;
            const [l, r] = span ?? [mid - g.gap, mid + g.gap];
            if (side === 'left') slot = Math.min(g.width, l);
            else {
              lineX = Math.max(0, r);
              slot = g.width - lineX;
            }
          }
          const lead = cursor === undefined && para > 0 ? indent : 0;
          // A paragraph never opens on the last line of the left column: it starts the right one.
          if (side === 'left' && lead > 0 && row === maxRows - 1) break;
          lineX += lead;
          slot -= lead;
          if (slot < minSlot) continue; // too narrow to set a line: leave the row empty

          const line = layoutNextLine(prepared[para], slot, cursor);
          if (!line) {
            para++;
            cursor = undefined;
            row--;
            continue;
          }
          const text = line.text.trimEnd();
          const last = layoutNextLine(prepared[para], slot, line.end) === null;
          // Justify to the slot, so the column edge draws the outline. Loose lines stay ragged,
          // and so does the narrow mobile column, where justified lines would open up too far.
          const spaces = text.split(' ').length - 1;
          const extra = spaces > 0 && !last && !g.mobile ? (slot - line.width) / spaces : 0;
          lines.push({ text, x: lineX, y, spacing: extra > 0 && extra <= g.fontSize * 0.55 ? extra : 0 });
          if (last) {
            para++;
            cursor = undefined;
          } else cursor = line.end;
        }
      };

      if (g.mobile) fill('single', 400);
      else {
        fill('left', rows);
        fill('right', rows);
      }
      return { lines, fits: para >= prepared.length };
    }

    /** The shortest pair of columns that holds the letter with the dress at x. */
    function fit(g: Geometry, x: number, wet: boolean) {
      if (g.mobile) return flow(g, x, 0, wet).lines;
      // Start from the last answer: between two frames it changes by a row at most.
      let rows = Math.max(3, lastRows - 1);
      let result = flow(g, x, rows, wet);
      if (result.fits) {
        // One row fewer may also do.
        const shorter = rows > 3 ? flow(g, x, rows - 1, wet) : null;
        if (shorter?.fits) {
          result = shorter;
          rows--;
        }
      } else {
        while (!result.fits && rows < g.rows + 60) result = flow(g, x, ++rows, wet);
      }
      lastRows = rows;
      return result.lines;
    }

    /** Widths of a word and of each letter in it, measured once (kerning included). */
    function wordOf(text: string) {
      let word = words.get(text);
      if (!word) {
        const chars = Array.from(text);
        const offsets: number[] = [];
        let prefix = '';
        for (const ch of chars) {
          offsets.push(ctx.measureText(prefix).width);
          prefix += ch;
        }
        word = { width: ctx.measureText(text).width, chars, offsets };
        words.set(text, word);
      }
      return word;
    }

    function paint() {
      const g = geo;
      if (!g || !profile) return;
      const wet = !calm;
      const lines = fit(g, figX, wet);
      figure.style.transform = `translate3d(${figX.toFixed(2)}px, ${g.figY}px, 0)`;

      const dpr = canvas.width / (g.width + PAD * 2);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, PAD * dpr, PAD * dpr);
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.textBaseline = 'alphabetic';

      for (const line of lines) {
        const y = line.y + baseline;
        const mid = line.y + g.lineHeight / 2;
        let x = line.x;
        for (const text of line.text.split(' ')) {
          const word = wordOf(text);
          // Letters ride the water one by one only where it is actually moving.
          const end = x + word.width;
          const moving =
            wet &&
            Math.abs(heightAt(x - CELL, mid) - heightAt(x + CELL, mid)) +
              Math.abs(heightAt(end - CELL, mid) - heightAt(end + CELL, mid)) +
              Math.abs(heightAt(x, mid - CELL) - heightAt(x, mid + CELL)) +
              Math.abs(heightAt(end, mid - CELL) - heightAt(end, mid + CELL)) >
              0.03;
          if (!moving) ctx.fillText(text, x, y);
          else {
            for (let i = 0; i < word.chars.length; i++) {
              const gx = x + word.offsets[i];
              const dx = (heightAt(gx - CELL, mid) - heightAt(gx + CELL, mid)) * LIFT;
              const dy = (heightAt(gx, mid - CELL) - heightAt(gx, mid + CELL)) * LIFT;
              ctx.fillText(word.chars[i], gx + dx, y + dy);
            }
          }
          x += word.width + spaceWidth + line.spacing;
        }
      }
    }

    /** Re-reads sizes (on load and on resize) and sets everything up for the new width. */
    function measure() {
      if (!profile) return;
      const style = getComputedStyle(copy);
      const fontSize = parseFloat(style.fontSize);
      const nextFont = `${style.fontStyle} ${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
      if (nextFont !== font) {
        font = nextFont;
        prepared = LETTER.map((p) => prepareWithSegments(p, font));
        words = new Map();
      }
      color = style.color;
      const width = stage.clientWidth;
      const mobile = window.matchMedia('(max-width: 767px)').matches;
      const g: Geometry = {
        width,
        height: 0,
        figW: figure.offsetWidth,
        figH: figure.offsetHeight,
        fontSize,
        lineHeight: parseFloat(style.lineHeight),
        gap: mobile ? 12 : Math.round(fontSize * 0.85),
        mobile,
        figY: 0,
        textTop: 0,
        rows: 0,
        restX: 0,
        minX: 0,
        maxX: 0,
      };
      g.restX = mobile ? width - g.figW : (width - g.figW) / 2;
      g.minX = mobile ? g.restX - width * 0.14 : Math.min(g.restX, width * 0.06);
      g.maxX = mobile ? g.restX : Math.max(g.restX, width * 0.94 - g.figW);

      if (!mobile) {
        // Shortest pair of columns that holds the letter, centred on the dress's height.
        for (let rows = 3; rows < 160; rows++) {
          const block = rows * g.lineHeight;
          g.textTop = Math.max(0, Math.round((g.figH - block) / 2));
          g.figY = Math.max(0, Math.round((block - g.figH) / 2));
          g.rows = rows;
          if (flow(g, g.restX, rows, false).fits) break;
        }
      }
      // Tall enough for the letter wherever the dress is dragged to.
      let bottom = g.figY + g.figH;
      for (let i = 0; i <= 8; i++) {
        const lines = fit(g, g.minX + ((g.maxX - g.minX) * i) / 8, false);
        bottom = Math.max(bottom, (lines.at(-1)?.y ?? 0) + g.lineHeight);
      }
      g.height = Math.ceil(bottom);
      stage.style.height = `${g.height}px`;
      stage.dataset.flow = 'on';

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round((width + PAD * 2) * dpr);
      canvas.height = Math.round((g.height + PAD * 2) * dpr);
      ctx.font = font;
      spaceWidth = ctx.measureText(' ').width;
      const metrics = ctx.measureText('Hg');
      baseline = (g.lineHeight - (metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent)) / 2 + metrics.fontBoundingBoxAscent;

      geo = g;
      figX = g.restX;
      resizeWater(g);
      markSolid(g);
      setSlider();
      paint();
    }

    function setSlider() {
      if (!geo) return;
      const range = geo.maxX - geo.minX;
      figure.setAttribute('aria-valuenow', String(range > 0 ? Math.round(((figX - geo.minX) / range) * 100) : 50));
    }

    // ---------- Animation: runs only while the water is moving or the dress is dragged ----------

    function tick(now: number) {
      frame = 0;
      // Waves keep the same speed on any display: one step per 60th of a second.
      const steps = Math.min(3, Math.max(1, Math.round((now - lastTime) / 16.67)));
      lastTime = now;
      if (!calm) {
        let peak = 0;
        for (let i = 0; i < steps; i++) peak = stepWater();
        if (peak < 0.012) {
          water.fill(0);
          waterPrev.fill(0);
          calm = true;
        }
      }
      paint();
      if (!calm || dragging) frame = requestAnimationFrame(tick);
    }

    function wake() {
      if (!frame) {
        lastTime = performance.now();
        frame = requestAnimationFrame(tick);
      }
    }

    // ---------- Pointer: ripples on the pool, and dragging the dress ----------

    let lastX = NaN;
    let lastY = NaN;
    const local = (e: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top] as const;
    };

    function onMove(e: PointerEvent) {
      if (!geo || dragging) return;
      const [x, y] = local(e);
      const moved = Math.hypot(x - lastX, y - lastY);
      if (moved < 6) return; // also skips the first event, which has no previous point
      drop(x, y, 2.4, Math.min(0.9, 0.18 + moved / 60));
      lastX = x;
      lastY = y;
    }

    function onEnter(e: PointerEvent) {
      [lastX, lastY] = local(e);
    }

    function onDown(e: PointerEvent) {
      if (!geo || figure.contains(e.target as Node)) return;
      const [x, y] = local(e);
      drop(x, y, 4.5, 2.6);
    }

    let grabOffset = 0;
    function moveFigure(x: number) {
      const g = geo!;
      const next = Math.min(g.maxX, Math.max(g.minX, x));
      if (next === figX) return;
      // The hem pushes a small wave ahead of it.
      const ahead = next > figX ? next + g.figW + 6 : next - 6;
      figX = next;
      markSolid(g);
      drop(ahead, g.figY + g.figH * 0.78, 2.4, 0.5);
      setSlider();
      wake();
    }

    function onGrab(e: PointerEvent) {
      if (!geo) return;
      dragging = true;
      grabOffset = e.clientX - figX;
      figure.setPointerCapture(e.pointerId);
      figure.dataset.dragging = 'true';
      e.preventDefault();
      wake();
    }

    function onDrag(e: PointerEvent) {
      if (dragging) moveFigure(e.clientX - grabOffset);
    }

    function onRelease() {
      dragging = false;
      delete figure.dataset.dragging;
    }

    function onKey(e: KeyboardEvent) {
      if (!geo || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
      e.preventDefault();
      moveFigure(figX + (e.key === 'ArrowLeft' ? -16 : 16));
      if (calm) paint();
    }

    // A typeface arriving late changes every width: measure the letter again from scratch.
    function onFonts() {
      clearCache();
      font = '';
      measure();
    }

    const resize = new ResizeObserver(() => measure());

    (async () => {
      const style = getComputedStyle(copy);
      // Widths must come from the real typeface, so wait for it before measuring anything.
      // A face that fails to load (a fallback entry in the stack) must not hold the letter back.
      await document.fonts
        .load(`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`, LETTER.join(' '))
        .catch(() => undefined);
      if (cancelled) return;
      profile = readProfile(figure.querySelector('svg')!);
      measure();
      resize.observe(stage);
      document.fonts.addEventListener('loadingdone', onFonts);
      stage.addEventListener('pointerenter', onEnter);
      stage.addEventListener('pointermove', onMove);
      stage.addEventListener('pointerdown', onDown);
      figure.addEventListener('pointerdown', onGrab);
      figure.addEventListener('pointermove', onDrag);
      figure.addEventListener('pointerup', onRelease);
      figure.addEventListener('pointercancel', onRelease);
      figure.addEventListener('keydown', onKey);
    })().catch(() => {
      /* The plain two-column letter stays in place. */
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      document.fonts.removeEventListener('loadingdone', onFonts);
      stage.removeEventListener('pointerenter', onEnter);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerdown', onDown);
      figure.removeEventListener('pointerdown', onGrab);
      figure.removeEventListener('pointermove', onDrag);
      figure.removeEventListener('pointerup', onRelease);
      figure.removeEventListener('pointercancel', onRelease);
      figure.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <section className={styles.section} aria-labelledby="letter-title">
      <h2 id="letter-title" className={styles.title} data-reveal="write">
        <Handwriting text="In our own words" />
      </h2>
      <div ref={stageRef} className={styles.stage} style={{ '--fig-ratio': ratio } as React.CSSProperties} data-reveal="rise">
        <canvas ref={canvasRef} className={styles.pool} aria-hidden="true" />
        <div
          ref={figureRef}
          className={styles.figure}
          role="slider"
          tabIndex={0}
          aria-label="Dress silhouette. Drag it, or use the left and right arrow keys, to move it through the text."
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={50}
        >
          {figure}
        </div>
        <div ref={copyRef} className={styles.copy}>
          {LETTER.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
