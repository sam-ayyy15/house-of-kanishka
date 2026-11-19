'use client';

import { useState } from 'react';
import styles from './TrackMap.module.css';

export type MapStop = {
  /** Position over the map, in % of its width and height. */
  left: number;
  top: number;
  name: string;
  words: string;
  when: string | null;
  /** When the route reaches it (ms after the page opens). */
  delay: number;
  kind: 'origin' | 'stop' | 'current';
  /** Show the town's name beside its mark (the start and the current town, unless crowded). */
  label: boolean;
  /** Which side of the mark the name sits on (default: towards the map's middle). */
  side?: 'left' | 'right';
};

type Destination = { left: number; top: number; name: string; delay: number; reached: boolean } | null;

/**
 * The towns on the map. Hover, focus or tap a mark to read what happened there; the parcel's
 * current town shows its note by default. Small square marks (the house never rounds corners),
 * a breathing red dot where the parcel is now, an open square for where it is going.
 */
export function MapStops({ stops, destination, children }: { stops: MapStop[]; destination: Destination; children: React.ReactNode }) {
  const current = stops.length - 1;
  const [pointing, setPointing] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const active = pointing ?? pinned ?? current;
  const shown = stops[active];
  const arrive = stops[current].delay;

  return (
    <>
      <div className={styles.frame}>
        {/* The map and its towns settle in together, so the marks never drift off their towns. */}
        <div className={styles.canvas}>
          {children}
          <div className={styles.layer} onMouseLeave={() => setPointing(null)}>
            {stops.map((s, i) => {
              return (
                <button
                  key={`${s.name}-${i}`}
                  type="button"
                  className={styles.stop}
                  data-kind={s.kind}
                  data-active={i === active || undefined}
                  style={{ left: `${s.left}%`, top: `${s.top}%`, '--d': `${Math.round(s.delay)}ms` } as React.CSSProperties}
                  aria-label={`${s.name}: ${s.words}${s.when ? `, ${s.when}` : ''}`}
                  aria-pressed={pinned === i}
                  onMouseEnter={() => setPointing(i)}
                  onFocus={() => setPointing(i)}
                  onBlur={() => setPointing(null)}
                  onClick={() => {
                    // A second tap on the same town lets go of it: back to where the parcel is now.
                    if (pinned === i) {
                      setPinned(null);
                      setPointing(null);
                    } else setPinned(i);
                  }}
                >
                  {s.kind === 'current' ? (
                    // Where the parcel is now: a red dot that breathes, with a soft glow (only while the map is on screen).
                    <span className={styles.here} data-loop aria-hidden="true">
                      <span className={styles.glow} />
                      <span className={styles.dot} />
                    </span>
                  ) : (
                    <span className={styles.mark} aria-hidden="true" />
                  )}
                  {s.label && (
                    <span className={styles.label} data-side={s.side ?? (s.left > 62 ? 'left' : 'right')} aria-hidden="true">
                      <span>{s.name}</span>
                    </span>
                  )}
                </button>
              );
            })}

            {destination && (
              <span
                className={styles.destination}
                style={{ left: `${destination.left}%`, top: `${destination.top}%`, '--d': `${Math.round(destination.delay)}ms` } as React.CSSProperties}
                aria-hidden="true"
              >
                <span className={styles.openMark} />
                <span className={styles.label} data-side={destination.left > 62 ? 'left' : 'right'}>
                  <span>{destination.name}</span>
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* What happened at the town in focus, just under the map (never over a town). */}
      <p className={styles.note} style={{ '--d': `${Math.round(arrive + 500)}ms` } as React.CSSProperties} aria-live="polite">
        {/* Keyed by town, so each change of town softly rises into place. */}
        <span key={active} className={styles.noteSwap}>
          <span className={styles.noteTown}>{shown.name}</span>
          <span className={styles.noteWords}>{shown.words}</span>
          {shown.when && <span className={styles.noteWhen}>{shown.when}</span>}
        </span>
      </p>
    </>
  );
}
