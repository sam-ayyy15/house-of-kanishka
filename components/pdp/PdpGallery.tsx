'use client';

import Image from 'next/image';
import { useState } from 'react';
import { galleryFor, type Product } from '@/lib/products';
import { useUI } from '@/lib/ui';
import { Lightbox } from './Lightbox';
import styles from './PdpGallery.module.css';

/**
 * 4:5 tiles on #F7F7F7, three across (spec §6.1). Mobile: a horizontally swipeable row.
 * Each tile opens the full-screen viewer with zoom. The photos follow the selected colour
 * (when a colour has its own gallery; see Colourway in lib/products.ts).
 */
export function PdpGallery({ product }: { product: Product }) {
  const colour = useUI().colour[product.slug];
  const images = galleryFor(product, colour);
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      {/* Keyed by colour: a different set of photos fades in rather than switching abruptly. */}
      <ul key={colour} className={styles.gallery} aria-label="Product images" data-count={Math.min(images.length, 3)}>
        {images.map((img, i) => (
          <li key={img.src} className={styles.tile} style={{ '--i': i } as React.CSSProperties}>
            {/* Placeholders: local-only crops of the reference. Never ship. */}
            <Image
              src={img.src}
              alt=""
              fill
              sizes="(max-width: 767px) 85vw, 33vw"
              className={img.fit === 'contain' ? styles.contain : styles.cover}
            />
            <button type="button" className={styles.open} aria-label={`Enlarge photo ${i + 1} of ${images.length}: ${img.alt}`} onClick={() => setOpen(i)} />
          </li>
        ))}
      </ul>
      <Lightbox images={images} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
    </>
  );
}
