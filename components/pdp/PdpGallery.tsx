import Image from 'next/image';
import type { GalleryImage } from '@/lib/products';
import styles from './PdpGallery.module.css';

/**
 * 4:5 tiles on #F7F7F7, three across (spec §6.1). Mobile: a horizontally swipeable row.
 * Zoom / 360° are [D] and not built.
 */
export function PdpGallery({ images }: { images: GalleryImage[] }) {
  return (
    <ul className={styles.gallery} aria-label="Product images">
      {images.map((img) => (
        <li key={img.src} className={styles.tile}>
          {/* Placeholders: local-only crops of the reference. Never ship. */}
          <Image
            src={img.src}
            alt={img.alt}
            fill
            sizes="(max-width: 767px) 85vw, 33vw"
            className={img.fit === 'contain' ? styles.contain : styles.cover}
          />
        </li>
      ))}
    </ul>
  );
}
