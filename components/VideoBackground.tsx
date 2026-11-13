'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './VideoBackground.module.css';

type Props = {
  sources: { src: string; type: string }[];
  poster: string;
  className?: string;
  /** false: plays through once per visit to the page and rests on its last frame. */
  loop?: boolean;
};

/**
 * Muted background video, looping unless loop={false} (spec §8.1 M1, §12.4 #6, §12.5).
 * - Loads only when the section is near the viewport.
 * - Shows the poster only, never playing, with prefers-reduced-motion or Save-Data.
 */
export function VideoBackground({ sources, poster, className, loop = true }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (reduced || saveData) return;

    // Start loading a little before the section arrives.
    const near = new IntersectionObserver(([entry]) => entry.isIntersecting && setLoad(true), { rootMargin: '200px 0px' });
    // A loop may start as soon as any of it shows. A film that plays once waits until a good
    // part of the section is on screen, so its opening isn't spent out of sight.
    const visible = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoad(true);
          // A film that plays once is not started again after it has finished.
          if (!video.ended) video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      loop ? { rootMargin: '200px 0px' } : { threshold: 0.4 },
    );
    near.observe(video);
    visible.observe(video);
    return () => {
      near.disconnect();
      visible.disconnect();
    };
  }, [loop]);

  return (
    <video
      ref={ref}
      className={`${styles.video} ${className ?? ''}`}
      poster={poster}
      muted
      loop={loop}
      playsInline
      preload="none"
      aria-hidden="true"
    >
      {load && sources.map((s) => <source key={s.src} src={s.src} type={s.type} />)}
    </video>
  );
}
