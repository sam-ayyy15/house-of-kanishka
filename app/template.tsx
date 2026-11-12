import { ViewTransition } from 'react';

/**
 * Page-to-page transition (client request). A template re-mounts on every navigation, so
 * React's <ViewTransition> sees the old page leave and the new one enter: the old page fades
 * out quickly, the new one fades in with a small rise (CSS in globals.css, "Page
 * transitions"). default="none" keeps other updates on a page from animating. Browsers
 * without the View Transitions API simply swap pages as before.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      {children}
    </ViewTransition>
  );
}
