'use client';

import { openQuickView } from '@/lib/ui';

/** Opens quick view for a product (the drawer lives in the layout: components/bag/QuickView.tsx). */
export function QuickViewButton({ slug, name, className }: { slug: string; name: string; className?: string }) {
  return (
    <button type="button" className={className} aria-label={`Quick view: ${name}`} onClick={() => openQuickView(slug)}>
      <span className="quick-text">Quick view</span>
      <span className="quick-plus" aria-hidden="true">
        +
      </span>
    </button>
  );
}
