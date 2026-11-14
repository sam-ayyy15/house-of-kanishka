'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { GalleryImage } from '@/lib/products';
import styles from './Lightbox.module.css';

type Props = {
  images: GalleryImage[];
  /** Index of the photo to show, or null when closed. */
  index: number | null;
  onIndex: (i: number) => void;
  onClose: () => void;
};

/**
 * Full-screen photo viewer on <dialog> (focus trap, Escape and focus return come with it).
 * Arrow keys or a sideways swipe change photo; a click or tap zooms in on that spot, and the
 * zoomed photo then follows the pointer (or a drag, on touch). Zoom is a transform only.
 */
export function Lightbox({ images, index, onIndex, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const open = index !== null;
  const [zoom, setZoom] = useState(false);
  const down = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (!open) setZoom(false);
  }, [open]);

  // Zoom is per photo.
  useEffect(() => setZoom(false), [index]);

  const step = (d: number) => {
    if (index === null) return;
    onIndex((index + d + images.length) % images.length);
  };

  function origin(e: React.PointerEvent | React.MouseEvent) {
    const el = stage.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--ox', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
    el.style.setProperty('--oy', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
  }

  const image = index !== null ? images[index] : undefined;

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-label="Product photos"
      onClose={onClose}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') step(1);
        if (e.key === 'ArrowLeft') step(-1);
      }}
    >
      <div className={styles.bar}>
        <p className={styles.count} aria-live="polite">
          {index !== null ? index + 1 : 0} / {images.length}
        </p>
        <button type="button" className={styles.close} onClick={onClose}>
          Close
        </button>
      </div>

      <div
        ref={stage}
        className={styles.stage}
        data-zoom={zoom || undefined}
        onPointerDown={(e) => {
          down.current = { x: e.clientX, y: e.clientY, moved: false };
        }}
        onPointerMove={(e) => {
          const d = down.current;
          if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) d.moved = true;
          // Zoomed: the photo follows the mouse, or a finger that is dragging.
          if (zoom && (e.pointerType === 'mouse' || d)) origin(e);
        }}
        onPointerUp={(e) => {
          const d = down.current;
          down.current = null;
          if (!d) return;
          const dx = e.clientX - d.x;
          if (!zoom && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(e.clientY - d.y) * 1.5) return step(dx < 0 ? 1 : -1);
          if (d.moved) return;
          origin(e);
          setZoom((z) => !z);
        }}
        onPointerCancel={() => {
          down.current = null;
        }}
      >
        {image && (
          <div key={image.src} className={styles.photo}>
            <Image src={image.src} alt={image.alt} fill sizes="100vw" draggable={false} priority />
          </div>
        )}
      </div>

      <div className={styles.foot}>
        <button type="button" className="text-link" onClick={() => step(-1)} disabled={images.length < 2}>
          Previous
        </button>
        <p className={styles.hint}>{zoom ? 'Click to zoom out' : 'Click to zoom in'}</p>
        <button type="button" className="text-link" onClick={() => step(1)} disabled={images.length < 2}>
          Next
        </button>
      </div>
    </dialog>
  );
}
