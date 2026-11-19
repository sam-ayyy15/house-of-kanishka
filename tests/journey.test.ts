import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { buildJourney, frame, parseHub, resolveHub, type Gazetteer, type Place } from '../lib/geo/journey.ts';
import { placeKey } from '../lib/geo/place-key.ts';
import { MAP_HEIGHT, MAP_WIDTH, project } from '../lib/geo/project.ts';

// The same lookup lib/geo/gazetteer.ts builds, over the real GeoNames table.
const data = JSON.parse(readFileSync(new URL('../lib/geo/india-places.json', import.meta.url), 'utf8'));
const inState = new Map<string, Place & { rank: number }>();
const anywhere = new Map<string, Place & { rank: number }>();
for (const [name, st, lat, lon, rank, alts] of data.places) {
  const place = { name, lat, lon, rank };
  for (const key of [placeKey(name), ...(alts ?? [])]) {
    const k = `${data.stateKeys[st]}|${key}`;
    if ((inState.get(k)?.rank ?? -1) < rank) inState.set(k, place);
    if ((anywhere.get(key)?.rank ?? -1) < rank) anywhere.set(key, place);
  }
}
const gaz: Gazetteer = (n, s) => {
  const hit = s ? inState.get(`${s}|${n}`) : anywhere.get(n);
  return hit ? { name: hit.name, lat: hit.lat, lon: hit.lon } : null;
};
const ORIGIN = { name: 'Udupi', lat: 13.335, lon: 74.746 };

test('parseHub splits Delhivery hub names into a state and town candidates', () => {
  assert.deepEqual(parseHub('Udupi_Ambalpady_D (Karnataka)'), { state: 'Karnataka', names: ['Udupi Ambalpady', 'Udupi', 'Ambalpady'] });
  assert.deepEqual(parseHub('HQ (Haryana)'), { state: 'Haryana', names: [] });
  assert.deepEqual(parseHub('Bhiwandi_Mankoli_HB'), { state: null, names: ['Bhiwandi Mankoli', 'Bhiwandi', 'Mankoli'] });
});

test('resolveHub finds the town, including old spellings, within the right state', () => {
  const town = (loc: string) => resolveHub(loc, gaz)?.name ?? null;
  assert.equal(town('Udupi_Ambalpady_D (Karnataka)'), 'Udupi');
  assert.equal(town('Bangalore_Nelmngla_H (Karnataka)'), 'Bengaluru');
  assert.equal(town('Mangalore_Kulshekar_I (Karnataka)'), 'Mangaluru');
  assert.equal(town('Gurgaon_Bilaspur_HB (Haryana)'), 'Gurugram');
  assert.equal(town('Mumbai_Bhiwandi_HB (Maharashtra)'), 'Mumbai');
  assert.equal(town('Cochin_Kakkanad_DC (Kerala)'), 'Kochi');
  assert.equal(town('Delhi_Okhla_PC (Delhi)'), 'Delhi');
  assert.equal(town('Port Blair_Garacharma_DC (Andaman & Nicobar Islands)'), 'Port Blair');
  assert.equal(town('HQ (Haryana)'), null); // no town in the name: kept off the map
  assert.equal(town('Xyzzyqq_Hub (Karnataka)'), null);
});

const scan = (at: string, status: string, location: string, type = 'UD') => ({ at, status, type, location });

test('a journey: Udupi → Mangaluru → Bengaluru, on its way to Delhi', () => {
  const j = buildJourney(
    {
      scans: [
        scan('2026-11-19T05:00:00Z', 'Manifested', 'Udupi_Ambalpady_D (Karnataka)'),
        scan('2026-11-19T11:00:00Z', 'In Transit', 'Udupi_Ambalpady_D (Karnataka)'),
        scan('2026-11-19T18:00:00Z', 'In Transit', 'Mangalore_Kulshekar_I (Karnataka)'),
        scan('2026-11-20T06:00:00Z', 'In Transit', 'HQ (Haryana)'), // unplaceable: skipped
        scan('2026-11-20T09:00:00Z', 'In Transit', 'Bangalore_Nelmngla_H (Karnataka)'),
      ],
      origin: ORIGIN,
      destination: { city: 'New Delhi', state: 'Delhi' },
      delivered: false,
    },
    gaz,
  );
  assert.deepEqual(j.stops.map((s) => s.name), ['Udupi', 'Mangaluru', 'Bengaluru']);
  assert.equal(j.stops[0].status, 'In Transit'); // the two Udupi scans merged, latest kept
  assert.equal(j.stops[0].along, 0);
  assert.equal(j.stops[2].along, 1);
  assert.ok(j.stops[1].along > 0 && j.stops[1].along < 1);
  assert.equal(j.destination?.name, 'Delhi'); // "New Delhi" is filed under Delhi: city level is enough
  assert.equal(j.destination?.reached, false);
  assert.match(j.route, /^M[\d.]+ [\d.]+Q/);
  assert.ok(j.ahead, 'a dashed path ahead to Delhi');
  // Udupi → Mangaluru → Bengaluru is roughly a fifth of the way to Delhi.
  assert.ok(j.progress! > 0.1 && j.progress! < 0.35, `progress ${j.progress}`);
});

test('delivered: the destination becomes the last stop and nothing is ahead', () => {
  const j = buildJourney(
    {
      scans: [scan('2026-11-19T05:00:00Z', 'Manifested', 'Udupi_Ambalpady_D (Karnataka)'), scan('2026-11-20T09:00:00Z', 'In Transit', 'Bangalore_Nelmngla_H (Karnataka)')],
      origin: ORIGIN,
      destination: { city: 'Mysore', state: 'Karnataka' },
      delivered: true,
    },
    gaz,
  );
  assert.deepEqual(j.stops.map((s) => s.name), ['Udupi', 'Bengaluru', 'Mysuru']);
  assert.equal(j.stops.at(-1)?.status, 'Delivered');
  assert.equal(j.destination?.reached, true);
  assert.equal(j.ahead, null);
  assert.equal(j.progress, 1);
});

test('no scans yet: just our address, and the way ahead', () => {
  const j = buildJourney({ scans: [], origin: ORIGIN, destination: { city: 'Udupi', state: 'Karnataka' }, delivered: false }, gaz);
  assert.equal(j.stops.length, 1);
  assert.equal(j.destination?.reached, true); // same town as us
  assert.equal(j.ahead, null);
  const far = buildJourney({ scans: [], origin: ORIGIN, destination: { city: 'Nowhere-ville', state: 'Karnataka' }, delivered: false }, gaz);
  assert.equal(far.destination, null); // an unknown town is simply not drawn
  assert.equal(far.progress, null);
});

test('the view: square, at least a region, never more than India', () => {
  const near = frame([project(13.3, 74.7), project(12.9, 74.9)]);
  assert.equal(near.size, 260);
  const far = frame([project(8.1, 77.5), project(34.1, 77.6), project(27.5, 95)]);
  assert.ok(far.size <= Math.max(MAP_WIDTH, MAP_HEIGHT) + 20);
  assert.ok(far.size > 400);
});
