/**
 * Price format from the reference (spec §10): "€" prefix, comma decimals, e.g. €80,95.
 * No common locale puts € before the number with a comma decimal, so it is built by hand.
 */
export function formatPrice(cents: number, { withCode = false } = {}): string {
  const value = (cents / 100).toFixed(2).replace('.', ',');
  return `€${value}${withCode ? ' EUR' : ''}`;
}
