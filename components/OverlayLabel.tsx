import Link from 'next/link';
import styles from './OverlayLabel.module.css';

type Props = {
  eyebrow: string;
  /** Title lines, rendered with a line break between them. */
  lines: string[];
  href?: string;
  className?: string;
  titleClassName?: string;
  style?: React.CSSProperties;
  /** Rise in on first scroll into view, after this many ms (for staggering labels). */
  revealDelay?: number;
};

/** Eyebrow + serif title, white on photo or red (spec §3.6). Destinations are [M]. */
export function OverlayLabel({ eyebrow, lines, href = '#', className, titleClassName, style, revealDelay }: Props) {
  return (
    <Link
      href={href}
      className={`${styles.label} ${className ?? ''}`}
      data-reveal={revealDelay === undefined ? undefined : 'rise'}
      style={revealDelay === undefined ? style : ({ ...style, '--reveal-delay': `${revealDelay}ms` } as React.CSSProperties)}
    >
      <span className={styles.eyebrow}>{eyebrow}</span>
      <span className={`${styles.title} ${titleClassName ?? ''}`}>
        {lines.map((line, i) => (
          <span key={i} className={styles.line}>
            {line}
          </span>
        ))}
      </span>
    </Link>
  );
}
