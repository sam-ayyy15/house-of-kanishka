'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import styles from '@/components/errors/Errors.module.css';
import { Emblem } from '@/components/Emblem';
import { Header } from '@/components/Header';
import { canRender3d } from '@/lib/can-render-3d';

// Three.js is only fetched when something has actually gone wrong, and never on the server.
const PetalScatter = dynamic(() => import('@/components/scene/PetalScatter'), { ssr: false });

/**
 * Something went wrong while showing a page. EXTRAPOLATED – no reference design.
 * The lotus opens, then comes apart into its petals (live 3D where the device allows it, the
 * plain logo otherwise). "Try again" gathers the petals back into the flower, then retries.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const anchor = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [scattered, setScattered] = useState(false);

  useEffect(() => {
    console.error(error);
  }, [error]);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    setEnabled(canRender3d());
    // The flower opens first, then it comes apart.
    const t = setTimeout(() => setScattered(true), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const retry = () => {
    if (!enabled || !ready || reduced) return reset();
    setScattered(false); // the petals return to the flower…
    setTimeout(reset, 1100); // …and then the page is tried again
  };

  return (
    <>
      <Header />
      <main className={styles.plain}>
        <div ref={wrap} className={styles.petals} aria-hidden="true">
          {enabled && <PetalScatter anchor={anchor} scattered={scattered} active={active} reduced={reduced} onReady={() => setReady(true)} />}
        </div>
        <div className={styles.copy}>
          {/* The lotus. The 3D petals take its place once they are ready. */}
          <div ref={anchor} className={styles.mark} data-hidden={ready || undefined} aria-hidden="true">
            <Emblem bloom="load" style={{ color: 'var(--vr-red)' }} />
          </div>
          <p className={styles.script} aria-hidden="true">
            A stitch dropped
          </p>
          <h1 className={styles.title}>Something came undone</h1>
          <p className={styles.lede}>We couldn’t show this page just now. Please try again; if it keeps happening, our team is here to help.</p>
          <div className={styles.actions}>
            <button type="button" className="btn btn-black" onClick={retry}>
              Try again
            </button>
            <Link href="/" className="text-link">
              Back to home
            </Link>
            <Link href="/help#support" className="text-link">
              Contact us
            </Link>
          </div>
          {error.digest && <p className={styles.digest}>Reference {error.digest}</p>}
        </div>
      </main>
    </>
  );
}
