import { Fragment } from 'react';

type Props = {
  text: string;
  /** Position of the first word in the heading's sequence (for multi-part headings). */
  from?: number;
};

/**
 * Splits a phrase into words that rise out of their own masks (globals.css, "Motion
 * layer 2"). Put it inside a heading that carries data-reveal="words" (animates on first
 * scroll into view) or data-rise="load" (animates on page load). Without either, and with
 * reduced motion, it renders as plain text.
 */
export function RiseWords({ text, from = 0 }: Props) {
  return (
    <>
      {text.split(' ').map((word, i) => (
        <Fragment key={i}>
          {i > 0 && ' '}
          <span className="rw" style={{ '--w': from + i } as React.CSSProperties}>
            <span>{word}</span>
          </span>
        </Fragment>
      ))}
    </>
  );
}
