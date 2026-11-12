type Props = {
  text: string;
  /** Position of the first letter in the phrase's sequence (for multi-line scripts). */
  from?: number;
  /** True when a parent is already aria-hidden: skips the screen-reader copy. */
  decorative?: boolean;
};

/**
 * A script phrase written letter by letter (globals.css, "Motion layer 2"). The parent
 * carries data-write="load" (writes on page load) or data-reveal="write" (on first scroll
 * into view). Screen readers get the phrase once; the letter spans are for the animation.
 */
export function Handwriting({ text, from = 0, decorative = false }: Props) {
  const letters = [...text].map((ch, i) =>
    ch === ' ' ? (
      ' '
    ) : (
      <span key={i} className="hw" style={{ '--k': from + i } as React.CSSProperties}>
        {ch}
      </span>
    ),
  );
  if (decorative) return <>{letters}</>;
  return (
    <>
      <span className="visually-hidden">{text}</span>
      <span aria-hidden="true">{letters}</span>
    </>
  );
}
