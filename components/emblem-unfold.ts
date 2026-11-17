import { EMBLEM_ORIGIN, EMBLEM_PETALS, EMBLEM_VIEWBOX } from './emblem-paths';

/**
 * The lotus unfolding from a closed bud: the motion every <Emblem> plays (globals.css "Emblem").
 *
 * It is one smooth movement of the whole drawing, never of separate petals: every point of every
 * line follows the same rule, so lines that touch keep touching and no two lines cross, at every
 * moment. In polar terms around the heart (angle 0 = straight up):
 * - the flower grows from small to its full size;
 * - its petals start gathered almost upright (a closed bud) and fan out to their real angles,
 *   points nearer the heart first, smoothly with distance, so the inner petals lead;
 * - straight down never moves, so the drawing is never torn below the heart;
 * - a soft circle widening from the heart lets the flower appear as it opens.
 * The last frame is the exact logo.
 */
export const UNFOLD = {
  dur: 2600, // ms
  scale0: 0.45, // starting size
  fan0: 0.2, // starting spread of the petals (1 = open)
  lag: 0.5, // how far behind the heart the outermost points open (0..1 of the time)
};

export const [, , EMBLEM_W, EMBLEM_H] = EMBLEM_VIEWBOX.split(' ').map(Number);
const [OX, OY] = EMBLEM_ORIGIN.split(' ').map((v) => parseFloat(v) / 100);
export const HEART: [number, number] = [OX * EMBLEM_W, OY * EMBLEM_H];

type Options = typeof UNFOLD;

/**
 * Builds the unfolding for a set of petal paths. Self-contained (it uses nothing from outside its
 * own body), so the same code is also sent as text in the home loading screen's inline script and
 * in the offline page, and plays there before any other script has loaded.
 */
export function createUnfold(ds: string[], hx: number, hy: number, o: Options) {
  // CSS-style cubic Bézier easing.
  function bezier(x1: number, y1: number, x2: number, y2: number) {
    function fx(t: number) {
      return 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
    }
    function fy(t: number) {
      return 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
    }
    return function (x: number) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let lo = 0;
      let hi = 1;
      let t = x;
      for (let i = 0; i < 22; i++) {
        t = (lo + hi) / 2;
        if (fx(t) < x) lo = t;
        else hi = t;
      }
      return fy(t);
    };
  }
  const grow = bezier(0.33, 0, 0.2, 1); // a gentle start and a long, soft landing
  const openEase = bezier(0.45, 0, 0.25, 1); // each point eases in and out of its opening
  function clamp01(t: number) {
    return Math.min(1, Math.max(0, t));
  }

  // Each path as text pieces around its numbers (the paths are only M, C and Z: x,y pairs), in
  // polar form around the heart.
  let reach = 0;
  const petals = ds.map(function (d) {
    const pieces = d.split(/(-?\d+(?:\.\d+)?)/);
    const text: string[] = [];
    const nums: number[] = [];
    for (let i = 0; i < pieces.length; i++) {
      if (i % 2) nums.push(Number(pieces[i]));
      else text.push(pieces[i]);
    }
    const r: number[] = [];
    const a: number[] = [];
    for (let i = 0; i < nums.length; i += 2) {
      const dx = nums[i] - hx;
      const dy = hy - nums[i + 1];
      const rr = Math.sqrt(dx * dx + dy * dy);
      if (rr > reach) reach = rr;
      r.push(rr);
      a.push(Math.atan2(dx, dy));
    }
    return { d: d, text: text, r: r, a: a };
  });

  /** The paths at time t (0..1). At t = 1 they are exactly the drawing. */
  function paths(t: number): string[] {
    if (t >= 1) return petals.map((p) => p.d);
    const scale = o.scale0 + (1 - o.scale0) * grow(t);
    return petals.map(function (p) {
      let out = p.text[0];
      for (let i = 0; i < p.r.length; i++) {
        const r = p.r[i];
        const a = p.a[i];
        const open = openEase(clamp01((t - o.lag * (r / reach)) / (1 - o.lag)));
        const fan = o.fan0 + (1 - o.fan0) * open;
        const w = Math.pow(Math.abs(a) / Math.PI, 3); // 1 straight down: that direction stays put
        const a2 = a * (fan + (1 - fan) * w);
        const r2 = r * scale;
        out += Math.round((hx + r2 * Math.sin(a2)) * 10) / 10 + p.text[i * 2 + 1] + Math.round((hy - r2 * Math.cos(a2)) * 10) / 10 + p.text[i * 2 + 2];
      }
      return out;
    });
  }

  /** Radius of the soft circle that lets the flower appear, at time t (drawing units). */
  function reveal(t: number) {
    return t >= 1 ? reach * 2 : reach * 1.35 * grow(clamp01(t * 1.3));
  }

  return { paths: paths, reveal: reveal, reach: reach };
}

const unfold = createUnfold(
  EMBLEM_PETALS.map((p) => p.d),
  HEART[0],
  HEART[1],
  UNFOLD,
);
export const unfoldPaths = unfold.paths;
export const unfoldReveal = unfold.reveal;
/** Distance from the heart to the farthest point of the drawing. */
export const EMBLEM_REACH = unfold.reach;

/**
 * Inline script for the home loading screen: unfolds its lotus from the moment the HTML arrives,
 * in step with the screen (it starts LOTUS_AT ms after the screen does), before the page's own
 * script has loaded, so the lotus is never late however slowly the rest of the page arrives.
 * Placed right after the lotus in the HTML. React leaves it alone (see Intro).
 */
export function introLotusScript(lotusAt: number) {
  return `(function(){try{var d=document.documentElement;if(d.getAttribute('data-intro')!=='go'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var svg=document.querySelector('.intro-lotus svg');if(!svg)return;
var ps=svg.querySelectorAll('g path'),rg=svg.querySelector('radialGradient'),ds=[];for(var i=0;i<ps.length;i++)ds.push(ps[i].getAttribute('d'));
var U=(${createUnfold.toString()})(ds,${HEART[0]},${HEART[1]},${JSON.stringify(UNFOLD)});
var start=(window.__hokIntroStart||performance.now())+${lotusAt};
function draw(now){var t=Math.min(1,Math.max(0,(now-start)/${UNFOLD.dur}));var p=U.paths(t);for(var i=0;i<ps.length;i++)ps[i].setAttribute('d',p[i]);rg.setAttribute('r',U.reveal(t));if(t<1)requestAnimationFrame(draw);}
draw(performance.now());svg.setAttribute('data-play','');window.__hokIntroLotus=1;}catch(e){}})();`;
}
