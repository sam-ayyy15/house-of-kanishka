import type { Metadata, Viewport } from 'next';
import { Footer } from '@/components/Footer';
import { RevealObserver } from '@/components/RevealObserver';
import { heroItalic, sans, script, serif } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'House of Kanishka',
  description: 'House of Kanishka: Parisian elegance and modern simplicity.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      // Lets Next jump to the top on page changes even though anchor links scroll smoothly.
      data-scroll-behavior="smooth"
      className={`${serif.variable} ${heroItalic.variable} ${script.variable} ${sans.variable}`}
    >
      <body>
        {children}
        <Footer />
        <RevealObserver />
      </body>
    </html>
  );
}
