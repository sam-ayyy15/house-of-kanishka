// Thin-stroke monochrome icons (spec §2.4). They inherit colour from the text.
type IconProps = { size?: number; className?: string };

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.25,
  'aria-hidden': true,
  focusable: false,
} as const;

/** Menu: two horizontal lines, the lower one shorter. */
export function MenuIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base} className={className} width={size} height={size * 0.5} viewBox="0 0 20 10">
      <path d="M0 3h20M0 8h13" />
    </svg>
  );
}

/** Shopping bag: rectangular tote outline with a small handle. */
export function BagIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base} className={className} width={size} height={size} viewBox="0 0 20 20">
      <path d="M4.5 6.5h11v11h-11z" />
      <path d="M7.5 6.5V5a2.5 2.5 0 0 1 5 0v1.5" />
    </svg>
  );
}

export function SearchIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base} className={className} width={size} height={size} viewBox="0 0 20 20">
      <circle cx="8.75" cy="8.75" r="5.75" />
      <path d="m13 13 4.5 4.5" />
    </svg>
  );
}
