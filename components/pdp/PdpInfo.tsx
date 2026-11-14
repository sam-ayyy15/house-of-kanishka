'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatPrice } from '@/lib/format';
import { colourwaysOf, type Product } from '@/lib/products';
import { addToBag, toggleWishlist, useStore } from '@/lib/store';
import { SIZE_CHART } from '@/lib/sizes';
import { openMiniBag, selectColour, useUI } from '@/lib/ui';
import { SizeGuide } from './SizeGuide';
import styles from './PdpInfo.module.css';

/**
 * PDP info column (spec §6.1–6.2): tabs, colour swatches and size select, ADD TO CART with the
 * price inside, and the wishlist button. Bag and wishlist are saved in this browser. Adding
 * slides the bag in. On phones a bar with the same button stays at the bottom of the screen
 * while the real one is out of view.
 */
export function PdpInfo({ product }: { product: Product }) {
  const tabs = ['Description', 'Details', 'Shipping & Returns', 'Size Guide'];
  const id = useId();
  const [active, setActive] = useState(0);
  const [size, setSize] = useState(product.sizes[0]);
  const [added, setAdded] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [mounted, setMounted] = useState(false);
  const purchaseRef = useRef<HTMLDivElement>(null);
  const colours = colourwaysOf(product);
  const colour = useUI().colour[product.slug] ?? product.colour;
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const wished = useStore().wishlist.includes(product.slug);

  // The button confirms in place, then returns to its normal label.
  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 2000);
    return () => clearTimeout(t);
  }, [added]);

  useEffect(() => setMounted(true), []);

  // The bottom bar (phones) shows while the real button is off screen, and not over the footer.
  useEffect(() => {
    const purchase = purchaseRef.current;
    const footer = document.querySelector('footer');
    if (!purchase) return;
    let purchaseIn = false;
    let footerIn = false;
    const update = () => setStuck(!purchaseIn && !footerIn);
    const a = new IntersectionObserver(([e]) => {
      purchaseIn = e.isIntersecting;
      update();
    });
    const b = new IntersectionObserver(([e]) => {
      footerIn = e.isIntersecting;
      update();
    });
    a.observe(purchase);
    if (footer) b.observe(footer);
    return () => {
      a.disconnect();
      b.disconnect();
    };
  }, []);

  function add() {
    addToBag(product.slug, size);
    setAdded(true);
    openMiniBag();
  }

  // WAI-ARIA tabs: arrow keys move between tabs, Home/End jump to the ends (spec §12.4 #7).
  function onKeyDown(e: React.KeyboardEvent) {
    const last = tabs.length - 1;
    const next =
      e.key === 'ArrowRight' ? (active === last ? 0 : active + 1)
      : e.key === 'ArrowLeft' ? (active === 0 ? last : active - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  const oneSize = product.sizes.length === 1;
  const panels = [
    <p key="d">{product.description}</p>,
    <ul key="t" className={styles.plainList}>
      {product.details.map((d) => (
        <li key={d}>{d}</li>
      ))}
    </ul>,
    // Promo section copy (spec §4.7), currency in EUR (approved).
    <p key="s">
      Enjoy free shipping on all orders above €350. Not the right fit? No problem. We offer hassle-free returns
      within 30 days of purchase.
    </p>,
    oneSize ? (
      <p key="g">This piece comes in one size.</p>
    ) : (
      // Placeholder chart: standard EU measurements until the brand's own chart is supplied.
      <table key="g" className={styles.sizeTable}>
        <thead>
          <tr>
            <th scope="col">Size</th>
            <th scope="col">Bust</th>
            <th scope="col">Waist</th>
            <th scope="col">Hips</th>
          </tr>
        </thead>
        <tbody>
          {SIZE_CHART.map((r) => (
            <tr key={r.size}>
              <th scope="row">{r.size}</th>
              <td>{r.bust} cm</td>
              <td>{r.waist} cm</td>
              <td>{r.hips} cm</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
  ];

  return (
    <div className={styles.info}>
      <div role="tablist" aria-label="Product information" className={styles.tablist} onKeyDown={onKeyDown}>
        {tabs.map((label, i) => (
          <button
            key={label}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={active === i}
            aria-controls={`${id}-panel-${i}`}
            tabIndex={active === i ? 0 : -1}
            className={styles.tab}
            onClick={() => setActive(i)}
          >
            {label}
          </button>
        ))}
      </div>
      {panels.map((panel, i) => (
        <div
          key={tabs[i]}
          role="tabpanel"
          id={`${id}-panel-${i}`}
          aria-labelledby={`${id}-tab-${i}`}
          hidden={active !== i}
          className={styles.panel}
        >
          {panel}
        </div>
      ))}

      <div className={styles.selects}>
        <div className={styles.colour} role="radiogroup" aria-label="Colour">
          <p className={styles.label}>
            Colour <span>{colour}</span>
          </p>
          <div className={styles.swatches}>
            {colours.map((c) => (
              <button
                key={c.name}
                type="button"
                role="radio"
                aria-checked={c.name === colour}
                aria-label={c.name}
                title={c.name}
                className={styles.swatch}
                style={{ '--hex': c.hex } as React.CSSProperties}
                onClick={() => selectColour(product.slug, c.name)}
              />
            ))}
          </div>
        </div>
        <label className={styles.select}>
          <span className="visually-hidden">Size</span>
          <select value={size} onChange={(e) => setSize(e.target.value)}>
            {product.sizes.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <svg className={styles.chevron} width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="m2 4 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.25" />
          </svg>
        </label>
        {!oneSize && (
          <button type="button" className={`text-link ${styles.guide}`} onClick={() => setGuideOpen(true)}>
            Size guide
          </button>
        )}
      </div>

      <div className={styles.purchase} ref={purchaseRef}>
        <button type="button" className={`btn btn-red ${styles.addToCart}`} onClick={add}>
          <span aria-live="polite">{added ? 'Added to bag' : 'Add to cart'}</span>
          <span>{formatPrice(product.priceCents, { withCode: true })}</span>
        </button>
        <button
          type="button"
          className={styles.wishlist}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wished}
          onClick={() => toggleWishlist(product.slug)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.4h2c.7-1.3 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"
              fill={wished ? 'var(--vr-red)' : 'none'}
              stroke="var(--vr-red)"
              strokeWidth="1.5"
            />
          </svg>
        </button>
      </div>

      {/* Phones only (CSS): the same purchase, kept in reach. Rendered on the page body: the info
          column's entrance animation would otherwise become the bar's positioning parent. */}
      {mounted &&
        createPortal(
          <div className={styles.sticky} data-show={stuck || undefined} inert={!stuck}>
            <label className={styles.stickySize}>
              <span className="visually-hidden">Size</span>
              <select value={size} onChange={(e) => setSize(e.target.value)} disabled={oneSize}>
                {product.sizes.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <button type="button" className={`btn btn-red ${styles.stickyAdd}`} onClick={add}>
              <span>Add to cart</span>
              <span>{formatPrice(product.priceCents)}</span>
            </button>
          </div>,
          document.body,
        )}

      <SizeGuide open={guideOpen} onClose={() => setGuideOpen(false)} sizes={product.sizes} onPick={setSize} />
    </div>
  );
}
