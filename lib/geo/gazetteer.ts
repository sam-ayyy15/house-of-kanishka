import 'server-only';
import data from './india-places.json';
import type { Gazetteer, Place } from './journey';
import { placeKey } from './place-key';

/**
 * The town lookup for the tracking map: GeoNames places (CC BY 4.0) indexed by state and name,
 * built once per server instance. Server only: the table never reaches the browser.
 */
type Entry = [string, number, number, number, number, string[]?];
let index: { inState: Map<string, Place & { rank: number }>; anywhere: Map<string, Place & { rank: number }> } | null = null;

function build() {
  const inState = new Map<string, Place & { rank: number }>();
  const anywhere = new Map<string, Place & { rank: number }>();
  for (const [name, st, lat, lon, rank, alts] of data.places as Entry[]) {
    const place = { name, lat, lon, rank };
    const sk = data.stateKeys[st];
    for (const key of [placeKey(name), ...(alts ?? [])]) {
      const k = `${sk}|${key}`;
      if ((inState.get(k)?.rank ?? -1) < rank) inState.set(k, place);
      if ((anywhere.get(key)?.rank ?? -1) < rank) anywhere.set(key, place);
    }
  }
  return { inState, anywhere };
}

export const indiaGazetteer: Gazetteer = (nameKey, stateKey) => {
  index ??= build();
  const hit = stateKey ? index.inState.get(`${stateKey}|${nameKey}`) : index.anywhere.get(nameKey);
  return hit ? { name: hit.name, lat: hit.lat, lon: hit.lon } : null;
};

/** Our pickup address (Ambalpadi, Udupi), where every journey starts. */
export const ORIGIN: Place = { name: 'Udupi', lat: 13.335, lon: 74.746 };
