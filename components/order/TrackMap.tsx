import { useId } from 'react';
import { Eyebrow } from '@/components/Eyebrow';
import { carrierWords } from '@/lib/delhivery-core';
import { INDIA_OUTLINE } from '@/lib/geo/india-outline';
import type { Journey } from '@/lib/geo/journey';
import { MapStops, type MapStop } from './MapStops';
import styles from './TrackMap.module.css';

/** When the route starts drawing, and how long it takes (ms). Stops appear as the line reaches them. */
const START = 450;
const DRAW = 1800;

const when = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date(iso)) : null;

/**
 * The parcel's journey on a drawn map of India, town by town as Delhivery scans it. EXTRAPOLATED
 * – no reference design (DESIGN_GUIDE.md: house tokens, hairlines, square marks). The red route is uncovered by a mask as if drawn by pen, each town's square mark
 * settles as the line reaches it, and a red dot breathes where the parcel is now. With reduced
 * motion everything is simply there. India's outline: Natural Earth's India point of view.
 */
export function TrackMap({ journey, delivered }: { journey: Journey; delivered: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const { view, stops, destination } = journey;
  const pos = (x: number, y: number) => ({ left: ((x - view.x) / view.size) * 100, top: ((y - view.y) / view.size) * 100 });
  const current = stops.length - 1;

  const all: MapStop[] = stops.map((s, i) => ({
    ...pos(s.x, s.y),
    name: s.name,
    words: i === 0 && !s.status ? 'Where your pieces set out' : (carrierWords(s.status, s.type) ?? 'Scanned here'),
    when: when(s.at),
    delay: START + s.along * DRAW,
    kind: i === current ? 'current' : i === 0 ? 'origin' : 'stop',
    label: i === 0 || i === current,
  }));
  // On a wide view, towns close together would sit on top of each other: keep the start and the
  // current town, and drop a passing town's mark if it would touch one already shown (its scan
  // is still on the timeline). Two close labels: only the current town keeps its name.
  const near = (a: MapStop, b: MapStop) => Math.hypot(a.left - b.left, a.top - b.top) < 3.4;
  const shown: MapStop[] = [all[0], ...(current > 0 ? [all[current]] : [])];
  for (const s of all.slice(1, current)) if (!shown.some((k) => near(k, s))) shown.push(s);
  if (current > 0 && near(all[0], all[current])) all[0].label = false;
  // When the current town is level with the start, the start's name goes on the side away from it.
  if (current > 0 && Math.abs(all[0].top - all[current].top) < 6) all[0].side = all[current].left > all[0].left ? 'left' : 'right';
  const mapStops = all.filter((s) => shown.includes(s));
  const dest =
    destination && !(delivered && destination.reached)
      ? { ...pos(destination.x, destination.y), name: destination.name, delay: START + DRAW + 250, reached: destination.reached }
      : null;

  const summary = [
    `Your parcel’s journey from ${stops[0].name}`,
    stops.length > 1
      ? `through ${stops
          .slice(1)
          .map((s) => s.name)
          .join(', ')}`
      : null,
    destination ? (delivered ? `delivered in ${destination.name}` : `on its way to ${destination.name}`) : null,
  ]
    .filter(Boolean)
    .join(', ');

  // The progress hairline, in plain words. Straight-line distances between towns, so "about".
  const share = journey.progress;
  const progressWords =
    share === null
      ? null
      : share >= 1
        ? delivered
          ? 'Delivered, the whole way'
          : 'Arrived in your city'
        : share < 0.05
          ? 'Just set out'
          : `About ${Math.round(share * 20) * 5}% of the way`;
  const from = stops[0].name;
  const to = destination?.name;

  return (
    <figure className={styles.map} style={{ '--start': `${START}ms`, '--draw': `${DRAW}ms`, '--progress': share ?? 0 } as React.CSSProperties}>
      <header className={styles.head}>
        <Eyebrow>The journey</Eyebrow>
        <p className={styles.leg}>
          {from}
          {to && to !== from && (
            <>
              {' '}
              <em>to</em> {to}
            </>
          )}
        </p>
      </header>

      <MapStops stops={mapStops} destination={dest}>
        <svg className={styles.svg} viewBox={`${view.x} ${view.y} ${view.size} ${view.size}`} role="img" aria-label={`${summary}.`}>
          <defs>
            <mask id={`route-${id}`} maskUnits="userSpaceOnUse" x={view.x} y={view.y} width={view.size} height={view.size}>
              <path d={journey.route} className={styles.pen} pathLength={1} style={{ strokeWidth: view.size * 0.012 }} />
            </mask>
          </defs>
          <path d={INDIA_OUTLINE} className={styles.land} />
          {journey.ahead && <path d={journey.ahead} className={styles.ahead} />}
          <path d={journey.route} className={styles.route} mask={`url(#route-${id})`} />
        </svg>
      </MapStops>

      {progressWords && (
        <div className={styles.progress}>
          <p className={styles.progressWords}>{progressWords}</p>
          {/* The house's progress hairline (the free-shipping bar's design), filling as the route arrives. */}
          <span
            className={styles.track}
            role="progressbar"
            aria-label="How far your parcel has come"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round((share ?? 0) * 100)}
          >
            <span className={styles.fillBar} />
          </span>
        </div>
      )}

      <figcaption className={styles.caption}>Town by town, as Delhivery scans your parcel. Map: Natural Earth. Places: GeoNames (CC BY 4.0).</figcaption>
    </figure>
  );
}
