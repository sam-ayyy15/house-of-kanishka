'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { formatPrice } from '@/lib/format';
import type { Look as LookData } from '@/lib/lookbook';
import { getProduct, productHref } from '@/lib/products';
import { openQuickView } from '@/lib/ui';
import { Eyebrow } from '../Eyebrow';
import { RiseWords } from '../RiseWords';
import styles from './Look.module.css';

/**
 * One look: a photo with tags on the pieces, and the same pieces listed beside it. A tag opens
 * a small card (name, price, view or quick view) on hover, focus or tap. EXTRAPOLATED – no
 * reference design.
 */
export function Look({ look, flip }: { look: LookData; flip: boolean }) {
  const [active, setActive] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const leave = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Tap outside, or Escape, closes the open card.
  useEffect(() => {
    if (!active) return;
    const out = (e: PointerEvent) => {
      if (!(e.target instanceof Element) || !e.target.closest(`[data-look="${look.id}"] [data-spot]`)) setActive(null);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setActive(null);
    document.addEventListener('pointerdown', out);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', out);
      document.removeEventListener('keydown', esc);
    };
  }, [active, look.id]);

  const pieces = look.hotspots.flatMap((h) => {
    const product = getProduct(h.slug);
    return product ? [{ ...h, product }] : [];
  });

  return (
    <article
      ref={root}
      className={styles.look}
      data-look={look.id}
      data-flip={flip || undefined}
      style={{ '--span': look.span } as React.CSSProperties}
      aria-labelledby={`${look.id}-title`}
    >
      <div className={styles.photo} data-reveal="rise">
        <div className={styles.frame} style={{ aspectRatio: look.width / look.height }}>
          <Image
            src={look.image}
            alt={look.alt}
            fill
            sizes="(max-width: 1023px) 100vw, 58vw"
            className={styles.image}
          />
        </div>

        <div className={styles.spots}>
          {pieces.map(({ slug, x, y, product }, i) => {
            const open = active === slug;
            return (
              <div
                key={slug}
                data-spot
                className={styles.spot}
                data-open={open || undefined}
                data-x={x > 55 ? 'right' : 'left'}
                data-y={y > 50 ? 'up' : 'down'}
                style={{ left: `${x}%`, top: `${y}%`, '--n': i } as React.CSSProperties}
                onPointerEnter={(e) => {
                  if (e.pointerType !== 'mouse') return;
                  clearTimeout(leave.current);
                  setActive(slug);
                }}
                onPointerLeave={(e) => {
                  if (e.pointerType !== 'mouse') return;
                  leave.current = setTimeout(() => setActive((a) => (a === slug ? null : a)), 220);
                }}
              >
                <button
                  type="button"
                  className={styles.tag}
                  aria-expanded={open}
                  aria-label={`${product.name}, ${formatPrice(product.priceCents)}`}
                  onClick={() => setActive(open ? null : slug)}
                >
                  <span aria-hidden="true">+</span>
                </button>
                <div className={styles.card} hidden={!open}>
                  <p className={styles.cardName}>{product.name}</p>
                  <p className={styles.cardPrice}>{formatPrice(product.priceCents)}</p>
                  <div className={styles.cardActions}>
                    <Link href={productHref(product)} className="text-link">
                      View
                    </Link>
                    <button type="button" className="text-link" onClick={() => openQuickView(product.slug)}>
                      Quick view
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.text}>
        <Eyebrow>Look {look.number}</Eyebrow>
        <h2 id={`${look.id}-title`} className={styles.title} data-reveal="words">
          <RiseWords text={look.title[0]} />{' '}
          <em>
            <RiseWords text={look.title[1]} from={look.title[0].split(' ').length} />
          </em>
        </h2>
        <p className={styles.copy} data-reveal="rise">
          {look.copy}
        </p>

        <div className={styles.shop} data-reveal="rise">
          <p className={styles.shopTitle}>In this look</p>
          <ul className={styles.pieces}>
            {pieces.map(({ slug, product }) => (
              <li
                key={slug}
                className={styles.piece}
                data-active={active === slug || undefined}
                onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(slug)}
              >
                <Link href={productHref(product)} className={styles.pieceName}>
                  {product.name}
                </Link>
                <span className={styles.piecePrice}>{formatPrice(product.priceCents)}</span>
                <button type="button" className={`text-link ${styles.pieceQuick}`} onClick={() => openQuickView(product.slug)}>
                  Quick view
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
