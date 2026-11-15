'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { SITE_NAME } from '@/lib/site';
import { EMBLEM_PETALS, EMBLEM_VIEWBOX } from './emblem-paths';
import { INTRO_DONE_MS, INTRO_END_MS, INTRO_NAV_OFFSET_MS } from './intro-script';

/** The lotus's petals grouped by ring (0 = the base): each ring is one layer, so each can bloom on the graphics layer. */
const RINGS = [0, 1, 2, 3].map((step) => EMBLEM_PETALS.filter((p) => p.step === step));

/**
 * Loading screen for the home page. EXTRAPOLATED – no reference design.
 *
 * Plays every time the home page is opened: on a first load or refresh of "/" (started before the
 * first paint by INTRO_SCRIPT, intro-script.ts) and whenever a visitor navigates to "/" from
 * another page (started here, before the new page paints). No other page has it.
 *
 * White screen. The black lotus blooms petal by petal (the site's own bloom), the house name is
 * written below it in the site's script red, and between them a red loading bar fills from one edge
 * of the screen to the other, as a page loads: quick at first, slowing, then finishing. When it is
 * full the screen splits in two along the bar, the lotus leaving with the upper half and the name
 * with the lower, and the page is revealed between them. About 5 seconds. There is no button; a
 * click, tap or Escape still skips it.
 *
 * Pure CSS and SVG. Everything that moves is a transform or an opacity, so the browser runs it on the
 * graphics layer, off the main thread: the page hydrating behind the screen cannot make it stutter. Not shown with reduced motion or Save-Data. Until the screen opens, the page's
 * own entrance animations are held (globals.css, "Opening title").
 */
export function Intro() {
  const pathname = usePathname();
  // The page the previous run saw. Starting only when the path really changes keeps this safe from
  // React running effects twice in development, which once looked like a second navigation.
  const previous = useRef<string | null>(null);

  const skip = () => {
    const root = document.documentElement;
    if (root.getAttribute('data-intro') !== 'go') return;
    root.setAttribute('data-intro', 'skip');
    setTimeout(() => {
      if (root.getAttribute('data-intro') === 'skip') {
        root.removeAttribute('data-intro');
        root.removeAttribute('data-intro-nav');
      }
    }, 420);
  };

  // Arriving at the home page from another page. (A first load or refresh of "/" has already been
  // started by the inline script, before the first paint.) A layout effect runs before the browser
  // paints the new page, so the screen is up before any of it shows.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const changed = previous.current !== null && previous.current !== pathname;
    previous.current = pathname;

    if (pathname !== '/') {
      root.removeAttribute('data-intro');
      root.removeAttribute('data-intro-nav');
      return;
    }
    // Not an arrival: either the first load of the page (the inline script has started it) or a repeat run.
    if (!changed) return;

    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || nav.connection?.saveData) return;

    root.setAttribute('data-intro-nav', '');
    root.setAttribute('data-intro', 'go');
    const done = setTimeout(() => {
      if (root.getAttribute('data-intro') === 'go') root.setAttribute('data-intro', 'done');
    }, INTRO_DONE_MS + INTRO_NAV_OFFSET_MS);
    const end = setTimeout(() => {
      root.removeAttribute('data-intro');
      root.removeAttribute('data-intro-nav');
    }, INTRO_END_MS + INTRO_NAV_OFFSET_MS);
    return () => {
      clearTimeout(done);
      clearTimeout(end);
    };
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && skip();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="intro" onClick={skip} role="presentation">
      <div className="intro-half intro-top">
        <div className="intro-lotus" aria-hidden="true">
          {RINGS.map((petals, ring) => (
            <svg key={ring} className="intro-ring" viewBox={EMBLEM_VIEWBOX} focusable="false" style={{ '--s': ring } as React.CSSProperties}>
              {petals.map((p, i) => (
                <path key={i} d={p.d} />
              ))}
            </svg>
          ))}
        </div>
      </div>
      <div className="intro-half intro-bottom">
        <p className="intro-name" aria-hidden="true">
          {SITE_NAME}
          <i className="intro-wipe" />
        </p>
      </div>
      <div className="intro-load" aria-hidden="true">
        <i className="intro-fill" />
      </div>
    </div>
  );
}
