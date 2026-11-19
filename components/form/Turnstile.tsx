'use client';

import { useEffect, useRef } from 'react';

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/** Cloudflare's script, loaded once, only on pages with a protected form. */
let loading: Promise<boolean> | null = null;
function loadTurnstile(): Promise<boolean> {
  if (window.turnstile) return Promise.resolve(true);
  loading ??= new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => resolve(!!window.turnstile);
    script.onerror = () => {
      loading = null;
      resolve(false);
    };
    document.head.appendChild(script);
  });
  return loading;
}

/**
 * The bot check for a form (lib/turnstile.ts checks it on the server). The widget is in
 * Cloudflare's Invisible mode: nothing ever appears on screen. Inside a <form> it adds the hidden "cf-turnstile-response" field
 * itself; `onToken` hands the token over for forms sent another way (checkout). Change
 * `resetKey` after each submission: a token can only be used once. Renders nothing until
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY is set.
 */
export function Turnstile({ action, onToken, resetKey, className }: { action: string; onToken?: (token: string | null) => void; resetKey?: unknown; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const tokenTo = useRef(onToken);
  tokenTo.current = onToken;

  useEffect(() => {
    if (!SITE_KEY || !box.current) return;
    let gone = false;
    const start = () =>
      void loadTurnstile().then((ok) => {
        if (!ok || gone || !box.current || !window.turnstile) return;
        widget.current = window.turnstile.render(box.current, {
          sitekey: SITE_KEY,
          action,
          callback: (token: string) => tokenTo.current?.(token),
          'expired-callback': () => tokenTo.current?.(null),
          'error-callback': () => tokenTo.current?.(null),
        });
      });
    // Cloudflare's script is large (several hundred KB with its challenge frame), so it is only
    // fetched once the form is within about a screen of view, or the moment someone uses it. That
    // still leaves the invisible check plenty of time to finish before they can press send. A form
    // already on screen (checkout, contact) starts at once, as before. The box itself has no size
    // in Invisible mode, so its parent (the form's block) is what is watched.
    const watched = box.current.parentElement ?? box.current;
    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        stop();
        start();
      },
      { rootMargin: '800px 0px' },
    );
    const onUse = () => {
      stop();
      start();
    };
    const stop = () => {
      near.disconnect();
      watched.removeEventListener('focusin', onUse);
      watched.removeEventListener('pointerdown', onUse);
    };
    near.observe(watched);
    watched.addEventListener('focusin', onUse);
    watched.addEventListener('pointerdown', onUse);
    return () => {
      stop();
      gone = true;
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = null;
    };
  }, [action]);

  // A new token after every submission (the last one has been used).
  useEffect(() => {
    if (widget.current && window.turnstile) {
      window.turnstile.reset(widget.current);
      tokenTo.current?.(null);
    }
  }, [resetKey]);

  if (!SITE_KEY) return null;
  return <div ref={box} className={`turnstile ${className ?? ''}`} />;
}
