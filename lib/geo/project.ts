/**
 * The tracking map's projection: simple equirectangular, with longitudes narrowed by the
 * cosine of India's middle latitude so the country keeps its familiar shape. 20 map units per
 * degree of latitude. Pure: used by the data script, the server and the tests.
 */
export const BOUNDS = { west: 68, east: 97.5, south: 6.5, north: 37.2 } as const;
const UNIT = 20;
const SQUEEZE = Math.cos((22 * Math.PI) / 180);

export const MAP_WIDTH = Math.round((BOUNDS.east - BOUNDS.west) * SQUEEZE * UNIT);
export const MAP_HEIGHT = Math.round((BOUNDS.north - BOUNDS.south) * UNIT);

export function project(lat: number, lon: number): { x: number; y: number } {
  return { x: (lon - BOUNDS.west) * SQUEEZE * UNIT, y: (BOUNDS.north - lat) * UNIT };
}

/** Distance in kilometres (great circle), to merge scans made in the same town. */
export function kmBetween(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r;
  const dLon = (b.lon - a.lon) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
