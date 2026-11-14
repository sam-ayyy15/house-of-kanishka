'use client';

import { openCookiePreferences } from '@/lib/consent';

/** Footer link that reopens the cookie panel. */
export function CookiePreferencesLink({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={openCookiePreferences}>
      Cookie preferences
    </button>
  );
}
