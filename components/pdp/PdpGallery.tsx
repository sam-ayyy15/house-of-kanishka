import Image from 'next/image';
import styles from './PdpGallery.module.css';

type Props = { images: { src: string; alt: string }[] };

/**
 * Three equal 4:5 tiles on #F7F7F7 (spec §6.1). Mobile: a horizontally swipeable row.
 * Zoom / 360° are [D] and not built.
 */
export function PdpGallery({ images }: Props) {
  return (
    <ul className={styles.gallery} aria-label="Product images">
      {images.map((img) => (
        <li key={img.src} className={styles.tile}>
          {/* Placeholder (A20–A22): local-only crops of the reference. Never ship. */}
          <Image src={img.src} alt={img.alt} fill sizes="(max-width: 767px) 85vw, 33vw" />
        </li>
      ))}
    </ul>
  );
}
