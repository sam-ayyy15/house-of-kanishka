'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { loadSavedStore, mergeSavedStore, saveStore } from '@/app/actions/store';
import { getStore, onStoreChange, replaceStore } from '@/lib/store';

/**
 * Keeps the browser's bag and wishlist in step with the signed-in customer's account.
 * - Just signed in: the guest's bag is merged into the saved one.
 * - Returning on a browser that is already theirs: the saved copy is loaded (so changes
 *   made on another device appear).
 * - Any change afterwards is saved a moment later.
 * - Signed out: the browser copy is cleared, so the next person on this device starts empty.
 * Renders nothing. Mounted once, inside ClerkProvider.
 */
export function StoreSync() {
  const { isLoaded, userId } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    const local = getStore();

    if (!userId) {
      if (local.owner) replaceStore({ bag: [], wishlist: [] });
      return;
    }

    let live = true;
    let ready = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const push = () => {
      const s = getStore();
      void saveStore({ bag: s.bag, wishlist: s.wishlist });
    };

    (async () => {
      const mine = local.owner === userId;
      const saved = mine ? await loadSavedStore() : await mergeSavedStore({ bag: local.bag, wishlist: local.wishlist });
      if (!live) return;
      // If the server could not be reached, keep working from the browser copy.
      if (saved) replaceStore(saved, userId);
      ready = true;
    })();

    const stop = onStoreChange(() => {
      if (!ready) return;
      clearTimeout(timer);
      timer = setTimeout(push, 500);
    });
    // A change made just before leaving the page is still sent.
    const flush = () => {
      if (timer === undefined) return;
      clearTimeout(timer);
      timer = undefined;
      push();
    };
    window.addEventListener('pagehide', flush);

    return () => {
      live = false;
      stop();
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [isLoaded, userId]);

  return null;
}
