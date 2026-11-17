// The business behind the shop, shown on the Contact and policy pages and (later) on bills.
// PLACEHOLDER DETAILS: every value below is a stand-in until the founder supplies the real
// legal name, address and contact details. Replace them here and they change everywhere.
export const BUSINESS = {
  placeholder: true,
  legalName: 'House of Kanishka',
  address: ['Address line (placeholder)', 'City, State 000000', 'India'],
  email: 'care@houseofkanishka.example',
  phone: '+91 00000 00000',
  hours: 'Monday to Saturday, 10 am to 6 pm IST',
  /** Where disputes are heard: follows the registered address. */
  jurisdiction: 'the city of the registered address above',
} as const;

/** Shown on legal pages; update when a policy's wording changes. */
export const POLICIES_UPDATED = '16 November 2026';
