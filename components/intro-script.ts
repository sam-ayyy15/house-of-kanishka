/** When the loading screen opens ("done") and is finally removed, in ms from its start. */
export const INTRO_DONE_MS = 3700;
export const INTRO_END_MS = 5500;
/** Arriving from another page, the browser's page transition covers the first moments: start a little late. */
export const INTRO_NAV_OFFSET_MS = 650;

/**
 * Runs in <head>, before the first paint, on every load of the home page (not other pages), unless
 * motion is not welcome. Visits that arrive by navigating inside the site are started by <Intro>.
 *
 * States of html[data-intro]:
 *   go    the loading screen plays; the page's own animations are held
 *   done  the screen splits open; the page's own animations are released
 *   skip  the visitor skipped it: a quick fade
 * then the attribute is removed.
 */
export const INTRO_SCRIPT = `(function(){try{var d=document.documentElement;d.classList.add('js');var c=navigator.connection;if(location.pathname!=='/'||matchMedia('(prefers-reduced-motion: reduce)').matches||(c&&c.saveData))return;d.setAttribute('data-intro','go');window.__hokIntroStart=performance.now();setTimeout(function(){if(d.getAttribute('data-intro')==='go')d.setAttribute('data-intro','done')},${INTRO_DONE_MS});setTimeout(function(){d.removeAttribute('data-intro')},${INTRO_END_MS})}catch(e){}})();`;
