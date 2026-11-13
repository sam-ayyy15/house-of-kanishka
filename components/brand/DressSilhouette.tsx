import { DRESS_PATH, DRESS_VIEWBOX } from './dress-silhouette-path';

export const DRESS_RATIO = DRESS_VIEWBOX.width / DRESS_VIEWBOX.height;

/**
 * The client's dress silhouette as inline SVG, so its path can be styled and animated from
 * CSS or JS (it takes the text colour). Rendered on the server: the path data stays out of
 * the script bundle. The viewBox keeps its proportions at any size.
 */
export function DressSilhouette({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${DRESS_VIEWBOX.width} ${DRESS_VIEWBOX.height}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <path data-dress="silhouette" d={DRESS_PATH} fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}
