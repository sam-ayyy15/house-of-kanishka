import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata, Viewport } from 'next';
import { AuthEnabledProvider } from '@/components/auth/AuthEnabled';
import { Footer } from '@/components/Footer';
import { RevealObserver } from '@/components/RevealObserver';
import { authEnabled } from '@/lib/auth-config';
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
      // Browser extensions add their own attributes to <html> before React loads. This
      // ignores attribute differences on this one tag only; the rest of the page is checked.
      suppressHydrationWarning
    >
      <body>
        {/* Accounts and sessions (Clerk). All screens are the site's own; Clerk supplies
            sign-in, verification emails, password resets and the secure session cookie. */}
        <AuthEnabledProvider enabled={authEnabled}>
          {authEnabled ? (
            <ClerkProvider signInUrl="/login" signUpUrl="/login" afterSignOutUrl="/">
              {children}
              <Footer />
            </ClerkProvider>
          ) : (
            <>
              {children}
              <Footer />
            </>
          )}
        </AuthEnabledProvider>
        <RevealObserver />
      </body>
    </html>
  );
}
