'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Also pauses looping decorations (`data-loop`) while they are off screen.
 *
 * Scroll reveals for any element carrying a `data-reveal` attribute ("rise" or "fade").
 * Content is server-rendered visible. On load, only elements still below the fold are
 * hidden, then each fades in once when it first scrolls into view. Nothing is hidden
 * with reduced motion, and nothing re-animates on scroll back.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Looping decorations (data-loop) only run while their section is on screen.
    const loops = [...document.querySelectorAll<HTMLElement>('[data-loop]')];
    const loopObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) (entry.target as HTMLElement).dataset.inview = String(entry.isIntersecting);
    });
    loops.forEach((el) => loopObserver.observe(el));

    const targets = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.revealState = 'in';
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    );

    for (const el of targets) {
      const state = el.dataset.revealState;
      if (state === 'in' || state === 'seen') continue;
      // Still pending from an earlier run of this effect: keep watching it.
      if (state === 'pending') {
        observer.observe(el);
        continue;
      }
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
        el.dataset.revealState = 'seen'; // already in view: leave it alone
      } else {
        el.dataset.revealState = 'pending';
        observer.observe(el);
      }
    }
    return () => {
      observer.disconnect();
      loopObserver.disconnect();
    };
  }, [pathname]);

  return null;
}
