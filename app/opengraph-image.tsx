import { ImageResponse } from 'next/og';
import { EMBLEM_PETALS, EMBLEM_VIEWBOX } from '@/components/emblem-paths';
import { SITE_NAME } from '@/lib/site';

// The picture shown when the site is shared (messages, social posts): brand red, the lotus, the name.
export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// The lotus is 250 px wide; its height follows the drawing's proportions.
const [, , VB_W, VB_H] = EMBLEM_VIEWBOX.split(' ').map(Number);
const LOTUS_H = Math.round((250 * VB_H) / VB_W);

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 36,
          background: '#a20f15',
          color: '#ffffff',
        }}
      >
        <svg width="250" height={LOTUS_H} viewBox={EMBLEM_VIEWBOX}>
          {EMBLEM_PETALS.map((p, i) => (
            <path key={i} d={p.d} fill="#ffffff" />
          ))}
        </svg>
        <div style={{ display: 'flex', fontSize: 84, letterSpacing: -1 }}>{SITE_NAME}</div>
        <div style={{ display: 'flex', fontSize: 28, letterSpacing: 4, textTransform: 'uppercase', opacity: 0.85 }}>
          Timeless silhouettes · contemporary allure
        </div>
      </div>
    ),
    size,
  );
}
