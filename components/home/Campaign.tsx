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
      {/* Placeholder (A02): local-only Ken Burns loop over a reference still. Never ship. */}
      <VideoBackground
        className={styles.video}
        poster="/placeholders/campaign.jpg"
        sources={[{ src: '/placeholders/campaign-loop.webm', type: 'video/webm' }]}
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
