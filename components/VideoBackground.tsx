'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './VideoBackground.module.css';

type Props = {
  sources: { src: string; type: string }[];
  poster: string;
  className?: string;
};

/**
 * Muted, looping background video (spec §8.1 M1, §12.4 #6, §12.5).
 * - Loads only when the section is near the viewport.
 * - Shows the poster only, never playing, with prefers-reduced-motion or Save-Data.
 */
export function VideoBackground({ sources, poster, className }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (reduced || saveData) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoad(true);
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { rootMargin: '200px 0px' },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className={`${styles.video} ${className ?? ''}`}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
    >
      {load && sources.map((s) => <source key={s.src} src={s.src} type={s.type} />)}
    </video>
  );
}
