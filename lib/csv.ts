/**
 * CSV for spreadsheets (Excel, Google Sheets, Numbers). Pure, so it can be unit-tested.
 *
 * - Fields with commas, quotes or line breaks are quoted, quotes doubled (RFC 4180).
 * - Text starting with = + - @ (or a tab / carriage return) gets a leading apostrophe, so a
 *   customer-typed name such as "=HYPERLINK(...)" is shown as text, never run as a formula.
 * - A byte-order mark lets Excel read the file as UTF-8 (names with accents, the ₹ sign).
 */
export type Cell = string | number | null | undefined;

const FORMULA = /^[=+\-@\t\r]/;

export function csvCell(value: Cell): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  let text = value;
  if (FORMULA.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: string[], rows: Cell[][]): string {
  return '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
