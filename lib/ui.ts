'use client';

// Small shared UI state: which overlay is open, and which colour is selected on a product
// page (so the gallery can follow the swatches). Nothing here is saved between visits.
import { useSyncExternalStore } from 'react';

type UI = {
  /** The slide-out bag that opens after something is added. */
  miniBag: boolean;
  /** Slug of the product shown in quick view, or null when closed. */
  quick: string | null;
  /** Selected colour name per product slug. */
  colour: Record<string, string>;
};

let ui: UI = { miniBag: false, quick: null, colour: {} };
const listeners = new Set<() => void>();

function set(next: Partial<UI>) {
  ui = { ...ui, ...next };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useUI(): UI {
  return useSyncExternalStore(subscribe, () => ui, () => ui);
}

export const openMiniBag = () => set({ miniBag: true });
export const closeMiniBag = () => set({ miniBag: false });
export const openQuickView = (slug: string) => set({ quick: slug });
export const closeQuickView = () => set({ quick: null });
export const selectColour = (slug: string, name: string) => set({ colour: { ...ui.colour, [slug]: name } });
