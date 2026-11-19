import { EMBLEM_PETALS, EMBLEM_VIEWBOX } from '@/components/emblem-paths';

// Built once at build time from the same paths as the inline lotus, so the two never drift.
export const dynamic = 'force-static';

/**
 * The lotus as a shared file, for every lotus that never unfolds (<Emblem bloom="none">: the
 * announcement ribbon's separators, skeletons, the invoice stamp…). Those draw it with
 * <use href="/emblem.svg#lotus">, so the ~11 KB of path data is fetched once and cached, instead
 * of being repeated in the page for every copy (the ribbon alone has 18).
 *
 * Page styles do not reach inside a <use> of another file, so the line styling that globals.css
 * gives `.emblem path` is written onto the paths here. Fill and stroke are currentColor: they take
 * the colour of the <svg> that uses it.
 */
export function GET() {
  const paths = EMBLEM_PETALS.map(
    (p) =>
      `<path d="${p.d}" fill="currentColor" stroke="currentColor" stroke-width="0.4" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`,
  ).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${EMBLEM_VIEWBOX}"><g id="lotus">${paths}</g></svg>`;
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
}
