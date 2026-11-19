/**
 * The parcel's journey for the tracking map, from Delhivery's scans. Delhivery gives hub
 * names only ("Udupi_Ambalpady_D (Karnataka)"), never coordinates, so each hub is matched to
 * its town (city level) through a gazetteer; hubs that can't be matched stay off the map.
 * Pure: the gazetteer is passed in, so this is unit-tested (tests/journey.test.ts).
 */
import { kmBetween, MAP_HEIGHT, MAP_WIDTH, project } from './project.ts';
import { placeKey, stateKey } from './place-key.ts';

export type Place = { name: string; lat: number; lon: number };
/** Finds a place by name (a placeKey) within a state (a stateKey), or anywhere when state is null. */
export type Gazetteer = (nameKey: string, stateKey: string | null) => Place | null;
export type ScanIn = { at: string; status: string; type: string; location: string };

/** Words in hub names that are not places: facility codes and types. */
const HUB_WORDS = new Set([
  'hub', 'dc', 'pc', 'gw', 'ipc', 'rpc', 'cpc', 'mpc', 'sc', 'hb', 'hq', 'dsp', 'lm', 'fm', 'pp', 'wh', 'cc', 'ph', 'mh',
  'mother', 'gateway', 'sorting', 'sortation', 'center', 'centre', 'facility', 'branch', 'warehouse', 'office', 'point',
  'delivery', 'pickup', 'transit', 'express', 'surface', 'air', 'nsz', 'oda', 'rto', 'dto', 'local', 'main', 'new',
]);

/** "Bangalore_Nelmngla_H (Karnataka)" → state "Karnataka"; names to try: "Bangalore Nelmngla", "Bangalore", "Nelmngla". */
export function parseHub(location: string): { state: string | null; names: string[] } {
  const m = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(location.trim());
  const base = (m ? m[1] : location).trim();
  const state = m ? m[2].trim() : null;
  const tokens = base
    .split(/[_\-\s,/.]+/)
    .filter((t) => t.length >= 3 && !/\d/.test(t) && !HUB_WORDS.has(t.toLowerCase()));
  const names: string[] = [];
  if (tokens.length > 1) names.push(tokens.join(' '));
  for (let i = 0; i < tokens.length - 1; i++) names.push(`${tokens[i]} ${tokens[i + 1]}`);
  names.push(...tokens);
  return { state, names: [...new Set(names)] };
}

/** The town a hub is in: the first name that matches in its state (or anywhere if no state). */
export function resolveHub(location: string, gazetteer: Gazetteer): Place | null {
  const { state, names } = parseHub(location);
  const sk = state ? stateKey(state) : null;
  for (const n of names) {
    const p = gazetteer(placeKey(n), sk);
    if (p) return p;
  }
  return null;
}

export type Stop = {
  name: string;
  x: number;
  y: number;
  /** Delhivery's last status there and when (null for our own address before any scan). */
  status: string | null;
  type: string | null;
  at: string | null;
  /** 0 → 1: how far along the drawn route this stop is reached (for the animation). */
  along: number;
};

export type Journey = {
  stops: Stop[]; // origin first, the parcel's current town last
  destination: { name: string; x: number; y: number; reached: boolean } | null;
  route: string; // SVG path through the stops
  ahead: string | null; // dashed path from the current town to the destination
  view: { x: number; y: number; size: number };
  /** 0 → 1: how far along the parcel is (straight-line distances between towns); null without a destination. */
  progress: number | null;
};

const SAME_TOWN_KM = 25;

/** A gentle arc from a to b (always bending the same way), as an SVG quadratic segment. */
function arc(a: { x: number; y: number }, b: { x: number; y: number }): string {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const bend = 0.16;
  const cx = (a.x + b.x) / 2 - dy * bend;
  const cy = (a.y + b.y) / 2 + dx * bend;
  return `Q${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}

export function buildJourney(
  input: {
    scans: ScanIn[];
    origin: Place;
    destination: { city: string; state: string } | null;
    delivered: boolean;
  },
  gazetteer: Gazetteer,
): Journey {
  type Raw = Place & { status: string | null; type: string | null; at: string | null };
  const raw: Raw[] = [{ ...input.origin, status: null, type: null, at: null }];
  for (const s of [...input.scans].sort((a, b) => a.at.localeCompare(b.at))) {
    const place = resolveHub(s.location, gazetteer);
    if (!place) continue;
    const last = raw[raw.length - 1];
    if (kmBetween(last, place) <= SAME_TOWN_KM) {
      // Still in the same town: keep the town, update what happened there last.
      Object.assign(last, { status: s.status, type: s.type, at: s.at });
    } else {
      raw.push({ ...place, status: s.status, type: s.type, at: s.at });
    }
  }

  let destination: Journey['destination'] = null;
  let remainingKm = 0;
  if (input.destination) {
    const d =
      gazetteer(placeKey(input.destination.city), stateKey(input.destination.state)) ??
      resolveHub(`${input.destination.city} (${input.destination.state})`, gazetteer);
    if (d) {
      const last = raw[raw.length - 1];
      const there = kmBetween(last, d) <= SAME_TOWN_KM;
      if (input.delivered && !there) raw.push({ ...d, status: 'Delivered', type: 'DL', at: null });
      const p = project(d.lat, d.lon);
      destination = { name: d.name, x: p.x, y: p.y, reached: input.delivered || there };
      if (!destination.reached) remainingKm = kmBetween(raw[raw.length - 1], d);
    }
  }

  const pts = raw.map((r) => ({ ...r, ...project(r.lat, r.lon) }));
  const seg = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
  const total = seg.reduce((a, b) => a + b, 0) || 1;
  let run = 0;
  const stops: Stop[] = pts.map((p, i) => {
    if (i > 0) run += seg[i - 1];
    return { name: p.name, x: p.x, y: p.y, status: p.status, type: p.type, at: p.at, along: i === 0 ? 0 : run / total };
  });

  // The drawn line skips a town lying within 3.4% of the view of the last town drawn (e.g.
  // Mangaluru just after Udupi on an all-India view): its mark is hidden by the same rule
  // (TrackMap), and it would otherwise put a little hook in the line.
  const view = frame([...pts, ...(destination ? [destination] : [])]);
  const line: typeof pts = [];
  for (const [i, p] of pts.entries()) {
    const last = line[line.length - 1];
    if (i === 0 || i === pts.length - 1 || Math.hypot(p.x - last.x, p.y - last.y) >= view.size * 0.034) line.push(p);
  }
  if (line.length > 2 && Math.hypot(line[line.length - 1].x - line[line.length - 2].x, line[line.length - 1].y - line[line.length - 2].y) < view.size * 0.034) line.splice(line.length - 2, 1);
  const route = `M${line[0].x.toFixed(1)} ${line[0].y.toFixed(1)}` + line.slice(1).map((p, i) => arc(line[i], p)).join('');
  const current = pts[pts.length - 1];
  const ahead =
    destination && !destination.reached ? `M${current.x.toFixed(1)} ${current.y.toFixed(1)}${arc(current, destination)}` : null;

  const travelledKm = raw.slice(1).reduce((km, r, i) => km + kmBetween(raw[i], r), 0);
  const progress = destination ? (destination.reached ? 1 : travelledKm / (travelledKm + remainingKm || 1)) : null;

  return { stops, destination, route, ahead, view, progress };
}

/**
 * A square view around the journey with room for labels: at least ~13° of latitude so a short
 * trip still shows its region, at most all of India.
 */
export function frame(points: { x: number; y: number }[]): Journey['view'] {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const full = Math.max(MAP_WIDTH, MAP_HEIGHT) + 20;
  const size = Math.min(full, Math.max(260, (maxX - minX) * 1.5 + 80, (maxY - minY) * 1.35 + 80));
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  // Keep the view over India where possible.
  const clamp = (v: number, lo: number, hi: number) => (lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v)));
  const x = clamp(cx - size / 2, -10, MAP_WIDTH + 10 - size);
  const y = clamp(cy - size / 2, -10, MAP_HEIGHT + 10 - size);
  return { x: Math.round(x), y: Math.round(y), size: Math.round(size) };
}
