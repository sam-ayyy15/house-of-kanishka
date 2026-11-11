import Link from 'next/link';
import styles from './OverlayLabel.module.css';

type Props = {
  eyebrow: string;
  /** Title lines, rendered with a line break between them. */
  lines: string[];
  href?: string;
  className?: string;
  style?: React.CSSProperties;
};

/** Eyebrow + serif title, white on photo or red (spec §3.6). Destinations are [M]. */
export function OverlayLabel({ eyebrow, lines, href = '#', className, style }: Props) {
  return (
    <Link href={href} className={`${styles.label} ${className ?? ''}`} style={style}>
      <span className={styles.eyebrow}>{eyebrow}</span>
      <span className={styles.title}>
        {lines.map((line, i) => (
          <span key={i} className={styles.line}>
            {line}
          </span>
        ))}
      </span>
    </Link>
  );
}
