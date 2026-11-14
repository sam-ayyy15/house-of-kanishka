import { OverlayLabel } from '../OverlayLabel';
import { VideoBackground } from '../VideoBackground';
import styles from './Campaign.module.css';

// Spec §4.3. "CAMPAING" corrected to "CAMPAIGN" (approved). Positions are % of the section.
const labels = [
  { key: 'tl', href: '/collections/ash-x-cos-2025', eyebrow: 'Campaign', lines: ['ASH X COS', '2025'] },
  { key: 'tr', href: '/collections/golden-hour-paris', eyebrow: 'Rose Mood', lines: ['Golden', 'Hour Paris'] },
  { key: 'bl', href: '/collections/midnight-rose', eyebrow: 'Campaign', lines: ['Midnight', 'Rôse'] },
  { key: 'br', href: '/collections/autumn-edition-paris', eyebrow: 'New Collection', lines: ['Autumn', 'Edition Paris'] },
] as const;

/** Homepage §4.3: full-bleed video background with four corner labels. */
export function Campaign() {
  return (
    <section className={styles.section} aria-label="Campaigns">
      {/* Client's own campaign film: muted, loops continuously while the section is on
          screen (poster only with reduced motion or Save-Data). Made from reference/images/v1.MP4 by
          scripts/make-videos.mjs. */}
      <VideoBackground
        className={styles.video}
        poster="/media/campaign-poster.jpg"
        sources={[{ src: '/media/campaign.mp4', type: 'video/mp4' }]}
      />
      {labels.map((l, i) => (
        <OverlayLabel
          key={l.key}
          href={l.href}
          eyebrow={l.eyebrow}
          lines={[...l.lines]}
          className={`${styles.label} ${styles[l.key]}`}
          revealDelay={i * 110}
        />
      ))}
    </section>
  );
}
