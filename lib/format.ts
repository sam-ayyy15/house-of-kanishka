/**
 * Prices are whole Indian rupees. Shown with the rupee sign in front and Indian digit grouping
 * (thousands, then lakhs and crores), e.g. ₹8,100 or ₹1,25,000. The reference mockups used euros
 * (€80,95); the shop sells in India, so the currency was changed (client request).
 */
const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export function formatPrice(rupees: number, { withCode = false } = {}): string {
  return `₹${inr.format(Math.round(rupees))}${withCode ? ' INR' : ''}`;
}
