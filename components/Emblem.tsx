import { EMBLEM_PETALS, EMBLEM_VIEWBOX } from './emblem-paths';

type Props = {
  className?: string;
  /**
   * How the petals open:
   * - "view": once, when it first scrolls into view (RevealObserver)
   * - "load": once, as soon as it appears (on page load, or when it is first rendered)
   * - "none": drawn open, no motion
   */
  bloom?: 'view' | 'load' | 'none';
  style?: React.CSSProperties;
};

/**
 * The House of Kanishka lotus (traced from reference/images/emblem.png by
 * scripts/make-emblem.mjs). Inline SVG in the text colour, one path per petal, so the
 * flower can open ring by ring, from its base to the top petals (globals.css, "Emblem").
 * Decorative: always hidden from screen readers. With reduced motion it is simply drawn.
 */
export function Emblem({ className, bloom = 'view', style }: Props) {
  return (
    <svg
      className={`emblem ${className ?? ''}`}
      viewBox={EMBLEM_VIEWBOX}
      data-reveal={bloom === 'view' ? 'bloom' : undefined}
      data-bloom={bloom === 'load' ? 'load' : undefined}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {EMBLEM_PETALS.map((p, i) => (
        <path key={i} d={p.d} fill="currentColor" style={{ '--s': p.step } as React.CSSProperties} />
      ))}
    </svg>
  );
}
