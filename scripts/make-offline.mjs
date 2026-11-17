// Writes public/offline.html: the page the service worker shows when a page can't be fetched.
// Self-contained (inline CSS, inline lotus, fonts from /fonts) so it works with no network.
import { readFileSync, writeFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const src = readFileSync('components/emblem-paths.ts', 'utf8');
const viewBox = src.match(/EMBLEM_VIEWBOX = '([^']+)'/)[1];
const origin = src.match(/EMBLEM_ORIGIN = '([^']+)'/)[1];
const petals = [...src.matchAll(/\{ name: '[^']+', step: (\d+), d: '([^']+)' \}/g)].map((m) => ({ step: +m[1], d: m[2] }));
if (petals.length < 5) throw new Error(`expected the emblem's petals, got ${petals.length}`);

const paths = petals.map((p) => `<path d="${p.d}"/>`).join('');

// The same unfolding as every <Emblem> on the site: components/emblem-unfold.ts with its types
// stripped (Node's own TypeScript support), with the drawing it needs written in front of it.
const unfoldTs = readFileSync('components/emblem-unfold.ts', 'utf8').replace(/^import .*$/m, '');
const unfoldJs = stripTypeScriptTypes(unfoldTs).replace(/^export /gm, '');
const unfoldScript =
  `var EMBLEM_VIEWBOX=${JSON.stringify(viewBox)},EMBLEM_ORIGIN=${JSON.stringify(origin)},EMBLEM_PETALS=${JSON.stringify(petals.map((p) => ({ d: p.d })))};\n` +
  unfoldJs;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#ffffff">
<title>Offline · House of Kanishka</title>
<style>
@font-face{font-family:"Instrument Serif";font-style:normal;font-weight:400;font-display:swap;src:url(/fonts/instrument-serif.woff2) format("woff2")}
@font-face{font-family:"Instrument Serif";font-style:italic;font-weight:400;font-display:swap;src:url(/fonts/instrument-serif-italic.woff2) format("woff2")}
@font-face{font-family:"Mrs Saint Delafield";font-style:normal;font-weight:400;font-display:swap;src:url(/fonts/mrs-saint-delafield.woff2) format("woff2")}
@font-face{font-family:"Inter";font-style:normal;font-weight:100 900;font-display:swap;src:url(/fonts/inter.woff2) format("woff2")}
:root{--red:#a20f15;--ease:cubic-bezier(.22,1,.36,1);--pad:clamp(20px,4vw,64px)}
*,*::before,*::after{box-sizing:border-box;border-radius:0}
html,body{margin:0}
body{min-height:100svh;display:flex;flex-direction:column;background:#fff;color:#000;font:13px/1.5 Inter,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased}
header{height:80px;display:flex;align-items:center;justify-content:center;font:400 clamp(26px,2.6vw,36px)/1 "Instrument Serif","Times New Roman",serif}
main{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;padding:0 var(--pad) 12vh;text-align:center}
svg{display:block;overflow:visible;width:clamp(104px,11vw,160px);color:var(--red)}
svg path{fill:currentColor;stroke:currentColor;stroke-width:.4px;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.script{font:400 clamp(54px,7vw,104px)/1 "Mrs Saint Delafield",cursive;color:var(--red);transform:rotate(-4deg);margin:4px 0 -6px}
h1{margin:0;font:400 clamp(34px,4.6vw,66px)/1.1 "Instrument Serif","Times New Roman",serif;text-wrap:balance}
p{margin:0}
.lede{font-size:15px;line-height:1.6;max-width:30em}
.btn{display:inline-flex;align-items:center;justify-content:center;height:48px;padding:0 24px;margin-top:10px;border:0;background:#000;color:#fff;font:500 15px Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;touch-action:manipulation;transition:background-color .2s ease,transform .12s var(--ease)}
.btn:active{transform:scale(.985)}
.btn:focus-visible{outline:1px solid currentColor;outline-offset:3px}
@media (hover:hover) and (pointer:fine){.btn:hover{background:#262626}}
.status{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#767676}
@keyframes rise{from{opacity:0;transform:translateY(16px)}}
@keyframes breathe{50%{opacity:.35}}
@media (prefers-reduced-motion:no-preference){
  main>:not(svg){animation:rise .8s var(--ease) both}
  main>:nth-child(3){animation-delay:.12s}main>:nth-child(4){animation-delay:.22s}main>:nth-child(5){animation-delay:.32s}main>:nth-child(6){animation-delay:.42s}
  .status[data-waiting]{animation:breathe 2.2s cubic-bezier(.65,0,.35,1) infinite}
}
</style>
</head>
<body>
<header>House of Kanishka</header>
<main>
<svg id="lotus" viewBox="${viewBox}" aria-hidden="true" focusable="false"><defs><radialGradient id="lr" gradientUnits="userSpaceOnUse" r="9999"><stop offset=".7" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient><mask id="lm" maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="5000" height="5000"><rect x="-2000" y="-2000" width="5000" height="5000" fill="url(#lr)"/></mask></defs><g mask="url(#lm)">${paths}</g></svg>
<p class="script" aria-hidden="true">Gone quiet</p>
<h1>You’re offline</h1>
<p class="lede">We can’t reach House of Kanishka right now. Check your connection and we’ll bring you back.</p>
<button class="btn" type="button" id="retry">Try again</button>
<p class="status" id="status" role="status" data-waiting>Waiting for a connection</p>
</main>
<script>
// The lotus unfolds from a closed bud, as everywhere on the site (drawn open if motion is unwelcome).
(function () {
${unfoldScript}
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var els = document.querySelectorAll('#lotus g path');
  var reveal = document.getElementById('lr');
  reveal.setAttribute('cx', HEART[0]);
  reveal.setAttribute('cy', HEART[1]);
  var start = performance.now();
  function frame(now) {
    var t = Math.min(1, (now - start) / UNFOLD.dur);
    var ds = unfoldPaths(t);
    for (var i = 0; i < els.length; i++) els[i].setAttribute('d', ds[i]);
    reveal.setAttribute('r', t >= 1 ? 9999 : unfoldReveal(t));
    if (t < 1) requestAnimationFrame(frame);
  }
  frame(start);
})();
(function () {
  var go = function () { location.reload(); };
  document.getElementById('retry').addEventListener('click', function () {
    var s = document.getElementById('status');
    s.textContent = navigator.onLine ? 'Trying again…' : 'Still offline';
    if (navigator.onLine) go();
  });
  window.addEventListener('online', go);
})();
</script>
</body>
</html>
`;
writeFileSync('public/offline.html', html);
console.log('public/offline.html', html.length, 'bytes');
