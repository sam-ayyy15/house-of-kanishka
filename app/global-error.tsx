'use client';

import { Emblem } from '@/components/Emblem';
import { heroItalic, sans, script, serif } from './fonts';
import './globals.css';

/**
 * Last resort: the root layout itself failed, so this page brings its own <html>. Plain on
 * purpose (no header, no 3D, nothing that could fail again): the lotus, the words, one button.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en" className={`${serif.variable} ${heroItalic.variable} ${script.variable} ${sans.variable}`}>
      <body>
        <main
          style={{
            minHeight: '100svh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 22,
            padding: '0 var(--pad-x)',
            textAlign: 'center',
          }}
        >
          <Emblem bloom="load" style={{ width: 96, color: 'var(--vr-red)' }} />
          <p style={{ fontFamily: 'var(--font-script)', fontSize: 'clamp(54px, 9vw, 96px)', lineHeight: 1, color: 'var(--vr-red)', transform: 'rotate(-4deg)' }}>
            A stitch dropped
          </p>
          <h1 className="page-title">Something came undone</h1>
          <p style={{ fontSize: 15, maxWidth: '30em' }}>We couldn’t load House of Kanishka just now. Please try again in a moment.</p>
          <button type="button" className="btn btn-black" onClick={() => reset()}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
