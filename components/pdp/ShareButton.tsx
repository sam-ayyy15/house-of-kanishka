'use client';

import { Check, Link2, Share2 } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import styles from './ShareButton.module.css';

type Props = { name: string; /** Path of the main photo (for Pinterest). */ image: string; className?: string };

/** Copies text, with a fallback for browsers or pages without the async clipboard. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}

/**
 * Share button for a product page. EXTRAPOLATED – no reference design: a square button beside the
 * wishlist heart. On phones it opens the device's own share sheet (every installed app); on
 * desktop it opens a small list: copy the link, WhatsApp, Telegram, Facebook, X, Pinterest,
 * email, and "More" for the system sheet where the browser has one. Only the product's address
 * and name are shared, and only when the visitor chooses a destination.
 */
export function ShareButton({ name, image, className }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canNative, setCanNative] = useState(false);
  const [touch, setTouch] = useState(false);
  const [link, setLink] = useState('');
  const [up, setUp] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const first = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setCanNative(typeof navigator.share === 'function');
    setTouch(window.matchMedia('(hover: none) and (pointer: coarse)').matches);
  }, []);

  // The address to share: this page, without any ?query or #hash.
  const pageUrl = () => {
    const u = new URL(window.location.href);
    u.search = '';
    u.hash = '';
    return u.toString();
  };

  // Close on a click elsewhere or Escape; focus goes to the first option on open.
  useEffect(() => {
    if (!open) return;
    setLink(pageUrl());
    // Opens upward when there is no room below the button (and there is above it).
    const r = button.current?.getBoundingClientRect();
    if (r) setUp(window.innerHeight - r.bottom < 380 && r.top > 380);
    first.current?.focus();
    const out = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener('pointerdown', out);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', out);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2200);
    return () => clearTimeout(t);
  }, [copied]);

  const title = `${name} · House of Kanishka`;

  async function nativeShare() {
    try {
      await navigator.share({ title, text: name, url: pageUrl() });
      setOpen(false);
    } catch {
      // Dismissed by the visitor: nothing to do.
    }
  }

  const u = encodeURIComponent(link);
  const t = encodeURIComponent(title);
  const media = link ? encodeURIComponent(new URL(image, link).toString()) : '';
  const targets = [
    { label: 'WhatsApp', href: `https://wa.me/?text=${t}%20${u}` },
    { label: 'Telegram', href: `https://t.me/share/url?url=${u}&text=${t}` },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { label: 'X', href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
    { label: 'Pinterest', href: `https://pinterest.com/pin/create/button/?url=${u}&media=${media}&description=${t}` },
    { label: 'Email', href: `mailto:?subject=${t}&body=${t}%0A${u}`, plain: true },
  ];

  return (
    <div ref={root} className={styles.wrap}>
      <button
        ref={button}
        type="button"
        className={className}
        aria-label="Share this piece"
        aria-expanded={open}
        aria-controls={`${id}-menu`}
        onClick={() => {
          // Phones: straight to the device's own share sheet.
          if (touch && canNative) void nativeShare();
          else setOpen((o) => !o);
        }}
      >
        <Share2 size={16} strokeWidth={1.25} aria-hidden="true" />
      </button>

      {open && (
        <div id={`${id}-menu`} className={styles.menu} data-up={up || undefined} role="group" aria-label="Share this piece">
          <p className={styles.heading}>Share</p>
          <ul className={styles.list}>
            <li>
              <button
                ref={first}
                type="button"
                className={styles.item}
                onClick={async () => setCopied(await copyText(pageUrl()))}
              >
                <span aria-live="polite">{copied ? 'Link copied' : 'Copy link'}</span>
                {copied ? <Check size={14} strokeWidth={1.25} aria-hidden="true" /> : <Link2 size={14} strokeWidth={1.25} aria-hidden="true" />}
              </button>
            </li>
            {targets.map((x) => (
              <li key={x.label}>
                <a
                  className={styles.item}
                  href={x.href}
                  {...(x.plain ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                  onClick={() => setOpen(false)}
                >
                  {x.label}
                  <span aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
            {canNative && (
              <li>
                <button type="button" className={styles.item} onClick={nativeShare}>
                  More…
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
