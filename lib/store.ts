'use client';

// Bag and wishlist, kept in this browser (localStorage) until accounts and a commerce
// backend exist. useSyncExternalStore keeps server and first client render identical.
import { useSyncExternalStore } from 'react';

export type BagLine = { slug: string; size: string; qty: number };
type State = { bag: BagLine[]; wishlist: string[] };

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
      state = { bag: Array.isArray(parsed.bag) ? parsed.bag : [], wishlist: Array.isArray(parsed.wishlist) ? parsed.wishlist : [] };
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

export const bagCount = (s: State) => s.bag.reduce((n, l) => n + l.qty, 0);

export function addToBag(slug: string, size: string) {
  const i = state.bag.findIndex((l) => l.slug === slug && l.size === size);
  const bag = i === -1
    ? [...state.bag, { slug, size, qty: 1 }]
    : state.bag.map((l, j) => (j === i ? { ...l, qty: l.qty + 1 } : l));
  set({ ...state, bag });
}

export function setQty(slug: string, size: string, qty: number) {
  const bag = qty <= 0
    ? state.bag.filter((l) => !(l.slug === slug && l.size === size))
    : state.bag.map((l) => (l.slug === slug && l.size === size ? { ...l, qty } : l));
  set({ ...state, bag });
}

export function toggleWishlist(slug: string) {
  const wishlist = state.wishlist.includes(slug) ? state.wishlist.filter((s) => s !== slug) : [...state.wishlist, slug];
  set({ ...state, wishlist });
}
