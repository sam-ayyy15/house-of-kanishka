import { OverlayLabel } from '../OverlayLabel';
import { VideoBackground } from '../VideoBackground';
import styles from './Campaign.module.css';

// Spec §4.3. "CAMPAING" corrected to "CAMPAIGN" (approved). Positions are % of the section.
const labels = [
  { key: 'tl', eyebrow: 'Campaign', lines: ['ASH X COS', '2025'] },
  { key: 'tr', eyebrow: 'Rose Mood', lines: ['Golden', 'Hour Paris'] },
  { key: 'bl', eyebrow: 'Campaign', lines: ['Midnight', 'Rôse'] },
  { key: 'br', eyebrow: 'New Collection', lines: ['Autumn', 'Edition Paris'] },
] as const;

/** Homepage §4.3: full-bleed video background with four corner labels. */
export function Campaign() {
  return (
    <section className={styles.section} aria-label="Campaigns">
      {/* Placeholder (A02): local-only Ken Burns loop over a reference still. Never ship. */}
      <VideoBackground
        poster="/placeholders/campaign.jpg"
        sources={[{ src: '/placeholders/campaign-loop.webm', type: 'video/webm' }]}
      />
      {labels.map((l) => (
        <OverlayLabel key={l.key} eyebrow={l.eyebrow} lines={[...l.lines]} className={`${styles.label} ${styles[l.key]}`} />
      ))}
    </section>
  );
}
