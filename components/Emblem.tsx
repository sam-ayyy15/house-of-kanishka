'use client';

import { useEffect, useId, useLayoutEffect, useRef } from 'react';
import { EMBLEM_PETALS, EMBLEM_VIEWBOX } from './emblem-paths';
import { EMBLEM_H, EMBLEM_REACH, EMBLEM_W, HEART, UNFOLD, unfoldPaths, unfoldReveal } from './emblem-unfold';

type Props = {
  className?: string;
  /**
   * When the lotus unfolds:
   * - "view": once, when it first scrolls into view
   * - "load": once, as soon as it appears (on page load, or when it is first rendered)
   * - "none": drawn open, no motion
   */
  bloom?: 'view' | 'load' | 'none';
  /** Wait this long (ms) before unfolding. Negative: start that far into the unfolding (to catch up). */
  delay?: number;
  /** Change it to unfold again (the home loading screen plays on every visit). */
  replay?: number;
  /** false: ready to unfold (hidden until played) but left to someone else to start. */
  play?: boolean;
  style?: React.CSSProperties;
} & Pick<React.SVGAttributes<SVGSVGElement>, 'id'> & { [key: `data-${string}`]: string | boolean | undefined };

// Runs before paint in the browser (so a lotus rendered by React never flashes open); not on the server.
const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * The House of Kanishka lotus (traced from reference/images/emblem.png by
 * scripts/make-emblem.mjs). Inline SVG in the text colour, one path per petal.
 * It unfolds from a closed bud (components/emblem-unfold.ts): the whole drawing moves as one, so
 * its lines never part or cross. Server-rendered open, so it shows without JavaScript; before the
 * page's script runs it is kept hidden only briefly (globals.css "Emblem"). Decorative: always
 * hidden from screen readers. With reduced motion it is simply drawn.
 */
export function Emblem({ className, bloom = 'view', delay = 0, replay = 0, play: autoplay = true, style, ...rest }: Props) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const svg = useRef<SVGSVGElement>(null);
  const paths = useRef<(SVGPathElement | null)[]>([]);
  const reveal = useRef<SVGRadialGradientElement>(null);
  const animated = bloom !== 'none';

  useBrowserLayoutEffect(() => {
    const el = svg.current;
    if (!el || !animated || !autoplay) return;
    let raf = 0;
    let timer = 0;
    let io: IntersectionObserver | undefined;

    const draw = (t: number) => {
      const ds = unfoldPaths(t);
      ds.forEach((d, i) => paths.current[i]?.setAttribute('d', d));
      reveal.current?.setAttribute('r', String(t >= 1 ? EMBLEM_REACH * 2 : unfoldReveal(t)));
    };
    const finish = () => {
      draw(1);
      el.dataset.play = '';
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return;
    }

    // Waiting: the bud is not shown yet.
    draw(0);
    el.dataset.play = '';

    const start = () => {
      timer = window.setTimeout(() => {
        const begin = performance.now() - Math.max(0, -delay);
        const frame = (now: number) => {
          const t = Math.min(1, (now - begin) / UNFOLD.dur);
          draw(t);
          if (t < 1) raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);
      }, Math.max(0, delay));
    };

    if (bloom === 'load') start();
    else {
      io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          io?.disconnect();
          start();
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.2 },
      );
      io.observe(el);
    }

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      io?.disconnect();
      // Unmounting or replaying mid-way: leave it open.
      draw(1);
    };
  }, [animated, autoplay, bloom, delay, replay]);

  return (
    <svg
      ref={svg}
      className={`emblem ${className ?? ''}`}
      viewBox={EMBLEM_VIEWBOX}
      data-bloom={animated ? bloom : undefined}
      style={style}
      // The home loading screen's lotus is drawn by an inline script before React arrives.
      suppressHydrationWarning
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {animated && (
        <defs>
          <radialGradient suppressHydrationWarning ref={reveal} id={`${id}r`} gradientUnits="userSpaceOnUse" cx={HEART[0]} cy={HEART[1]} r={EMBLEM_REACH * 2}>
            <stop offset="0.7" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </radialGradient>
          <mask id={`${id}m`} maskUnits="userSpaceOnUse" x={-EMBLEM_W} y={-EMBLEM_H} width={EMBLEM_W * 3} height={EMBLEM_H * 3}>
            <rect x={-EMBLEM_W} y={-EMBLEM_H} width={EMBLEM_W * 3} height={EMBLEM_H * 3} fill={`url(#${id}r)`} />
          </mask>
        </defs>
      )}
      <g mask={animated ? `url(#${id}m)` : undefined}>
        {EMBLEM_PETALS.map((p, i) => (
          <path
            key={i}
            ref={(node) => {
              paths.current[i] = node;
            }}
            d={p.d}
            fill="currentColor"
            suppressHydrationWarning
          />
        ))}
      </g>
    </svg>
  );
}
