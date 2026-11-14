'use client';

import { useEffect, useRef } from 'react';
import styles from './VideoBackground.module.css';

type Props = {
  /** In order of preference. Give each a full `type` with codecs, e.g. 'video/webm; codecs="vp8"'. */
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
 *
 * The file is chosen and started from script rather than with <source> children, because
 * that is the only way to make it dependable across browsers:
 * - A browser may say it can play a container (Safari and WebM) and then fail to decode the
 *   codec inside. It does not move on to the next <source> after that, so the video would
 *   stay blank. Here the next candidate is tried whenever one fails.
 * - Autoplay is started only once a file is attached, and is retried on the visitor's first
 *   touch or key press if the browser refused it (iOS Low Power Mode does this).
 */
export function VideoBackground({ sources, poster, className, loop = true }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (reduced || saveData) return;

    // Safari needs the muted *property* set before play(); React only sets the attribute.
    video.muted = true;
    const playable = sources.filter((s) => video.canPlayType(s.type) !== '');
    let index = -1; // the candidate currently attached
    let wanted = false; // is the section on screen right now?

    const play = () => {
      // A film that plays once is not started again after it has finished.
      if (!wanted || video.ended) return;
      video.play().catch((error: unknown) => {
        // Refused until the visitor interacts: try again on their first touch or key.
        if (error instanceof DOMException && error.name === 'NotAllowedError') {
          const retry = () => {
            window.removeEventListener('pointerdown', retry);
            window.removeEventListener('keydown', retry);
            play();
          };
          window.addEventListener('pointerdown', retry, { once: true });
          window.addEventListener('keydown', retry, { once: true });
        }
      });
    };

    /** Attaches the next candidate. Returns false when there is none left. */
    const attach = () => {
      if (index + 1 >= playable.length) return false;
      index++;
      video.preload = 'auto';
      video.src = playable[index].src;
      video.load();
      play();
      return true;
    };

    const onError = () => void attach(); // can't decode this one: fall back to the next
    video.addEventListener('error', onError);
    video.addEventListener('canplay', play);

    // Start loading a little before the section arrives.
    const near = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && index < 0) attach();
    }, { rootMargin: '200px 0px' });
    // A loop may start as soon as any of it shows. A film that plays once waits until a good
    // part of the section is on screen, so its opening isn't spent out of sight.
    const visible = new IntersectionObserver(
      ([entry]) => {
        wanted = entry.isIntersecting;
        if (!wanted) return video.pause();
        if (index < 0) attach();
        else play();
      },
      loop ? { rootMargin: '200px 0px' } : { threshold: 0.4 },
    );
    near.observe(video);
    visible.observe(video);
    return () => {
      near.disconnect();
      visible.disconnect();
      video.removeEventListener('error', onError);
      video.removeEventListener('canplay', play);
    };
    // `sources` is a fresh array on every render of the parent; its content never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    />
  );
}
