'use client';

// Bag and wishlist. The browser's copy (localStorage) is what every component reads, so the
// site works the same for guests. For a signed-in customer, components/StoreSync.tsx keeps
// it in step with the copy saved to their account. useSyncExternalStore keeps server and
// first client render identical.
import { useSyncExternalStore } from 'react';

export type BagLine = { slug: string; size: string; qty: number };
/** `owner` is the signed-in customer this browser copy belongs to (absent for a guest). */
type State = { bag: BagLine[]; wishlist: string[]; owner?: string };

const KEY = 'hok-store-v1';
const EMPTY: State = { bag: [], wishlist: [] };

let state: State = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<State>;
      state = {
        bag: Array.isArray(parsed.bag) ? parsed.bag : [],
        wishlist: Array.isArray(parsed.wishlist) ? parsed.wishlist : [],
        ...(typeof parsed.owner === 'string' ? { owner: parsed.owner } : {}),
      };
    }
  } catch {
    // Storage blocked or corrupt: start empty.
  }
}

function set(next: State) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage blocked: state still works for this visit.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    loaded = false;
    load();
    listeners.forEach((l) => l());
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

const getSnapshot = () => {
  load();
  return state;
};
const getServerSnapshot = () => EMPTY;

export function useStore(): State {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** For StoreSync: read the current copy, replace it wholesale, and hear about changes. */
export const getStore = getSnapshot;

export function replaceStore(next: { bag: BagLine[]; wishlist: string[] }, owner?: string) {
  set({ bag: next.bag, wishlist: next.wishlist, ...(owner ? { owner } : {}) });
}

export function onStoreChange(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** After an order is placed: the bag empties, the wishlist stays. */
export function clearBag() {
  set({ ...state, bag: [] });
}

export const MAX_QTY = 10;

export const bagCount = (s: State) => s.bag.reduce((n, l) => n + l.qty, 0);

export function addToBag(slug: string, size: string) {
  const i = state.bag.findIndex((l) => l.slug === slug && l.size === size);
  const bag = i === -1
    ? [...state.bag, { slug, size, qty: 1 }]
    : state.bag.map((l, j) => (j === i ? { ...l, qty: Math.min(MAX_QTY, l.qty + 1) } : l));
  set({ ...state, bag });
}

export function setQty(slug: string, size: string, qty: number) {
  const bag = qty <= 0
    ? state.bag.filter((l) => !(l.slug === slug && l.size === size))
    : state.bag.map((l) => (l.slug === slug && l.size === size ? { ...l, qty: Math.min(MAX_QTY, qty) } : l));
  set({ ...state, bag });
}

export function toggleWishlist(slug: string) {
  const wishlist = state.wishlist.includes(slug) ? state.wishlist.filter((s) => s !== slug) : [...state.wishlist, slug];
  set({ ...state, wishlist });
}
