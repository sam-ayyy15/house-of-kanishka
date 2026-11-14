'use client';

// Cookie choices, kept in this browser. Nothing in the site reads them yet: when analytics or
// marketing tools are added later, check `hasConsent('analytics')` before loading them.
// Essential cookies (sign-in, the bag) need no consent and are always on.
import { useSyncExternalStore } from 'react';

export type Consent = { analytics: boolean; marketing: boolean; at: number };

const KEY = 'hok-consent-v1';
const listeners = new Set<() => void>();
let prefsOpen = false;
let cache: { raw: string | null; value: Consent | null } = { raw: undefined as unknown as string, value: null };

function read(): Consent | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    // Storage blocked: treated as no choice made yet.
  }
  if (cache.raw === raw) return cache.value;
  let value: Consent | null = null;
  try {
    const p = raw ? JSON.parse(raw) : null;
    if (p && typeof p.analytics === 'boolean' && typeof p.marketing === 'boolean') value = p;
  } catch {
    // Corrupt: ask again.
  }
  cache = { raw, value };
  return value;
}

const emit = () => listeners.forEach((l) => l());

export function saveConsent(analytics: boolean, marketing: boolean) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ analytics, marketing, at: Date.now() }));
  } catch {
    // Storage blocked: the choice lasts for this visit only.
  }
  prefsOpen = false;
  emit();
}

export const hasConsent = (kind: 'analytics' | 'marketing') => read()?.[kind] === true;

export function openCookiePreferences() {
  prefsOpen = true;
  emit();
}

export function closeCookiePreferences() {
  prefsOpen = false;
  emit();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

/** 'unknown' on the server and during hydration; then the saved choice, or null if none yet. */
export function useConsent(): { ready: boolean; consent: Consent | null; prefsOpen: boolean } {
  const consent = useSyncExternalStore<Consent | null | 'unknown'>(subscribe, read, () => 'unknown');
  const open = useSyncExternalStore(subscribe, () => prefsOpen, () => false);
  return { ready: consent !== 'unknown', consent: consent === 'unknown' ? null : consent, prefsOpen: open };
}
