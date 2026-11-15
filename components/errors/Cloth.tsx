'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { canRender3d } from '@/lib/can-render-3d';
import styles from './Cloth.module.css';

// Three.js is only fetched on the pages that use it, and never on the server.
const SatinDrape = dynamic(() => import('../scene/SatinDrape'), { ssr: false });

/**
 * The satin backdrop. The drawn (CSS) satin is always there first: it is what shows with no
 * script, with Save-Data, without WebGL, and while the 3D cloth loads. The live cloth fades in
 * over it once its first frame is ready, and sleeps while off screen.
 */
export function Cloth({ children }: { children?: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(true);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    setEnabled(canRender3d());
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={styles.cloth}>
      <div className={styles.live} data-ready={ready || undefined} aria-hidden="true">
        {enabled && <SatinDrape active={active} reduced={reduced} onReady={() => setReady(true)} />}
      </div>
      {children}
    </div>
  );
}
