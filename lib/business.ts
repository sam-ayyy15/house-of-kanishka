// The business behind the shop, shown on the Contact and policy pages and on bills.
// Change a value here and it changes everywhere.
export const BUSINESS = {
  /** false: real details are in place, so the contact form delivers to `email`. */
  placeholder: false,
  legalName: 'House of Kanishka',
  address: ['Ambalpadi Junction, NH 66, Ambalpady', 'Udupi, Karnataka 576103', 'India'],
  email: 'house@houseofkanishka.in',
  /** Leave empty to hide the line on the Contact page. */
  phone: '+91 89512 05563',
  hours: 'Monday to Saturday, 10 am to 6 pm IST',
  /** Where disputes are heard: follows the registered address. */
  jurisdiction: 'Udupi, Karnataka',
} as const;

/** Shown on legal pages; update when a policy's wording changes. */
export const POLICIES_UPDATED = '18 November 2026';
