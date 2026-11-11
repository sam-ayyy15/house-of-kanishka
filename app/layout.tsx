import type { Metadata, Viewport } from 'next';
import { heroItalic, sans, script, serif } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vivienne Rôse',
  description: 'Vivienne Rôse: Parisian elegance and modern simplicity.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${heroItalic.variable} ${script.variable} ${sans.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
