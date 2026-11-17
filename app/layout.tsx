import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata, Viewport } from 'next';
import { AuthEnabledProvider } from '@/components/auth/AuthEnabled';
import { MiniBag } from '@/components/bag/MiniBag';
import { QuickView } from '@/components/bag/QuickView';
import { CatalogProvider } from '@/components/CatalogProvider';
import { CookieConsent } from '@/components/CookieConsent';
import { Intro } from '@/components/Intro';
import { INTRO_SCRIPT } from '@/components/intro-script';
import { Footer } from '@/components/Footer';
import { RevealObserver } from '@/components/RevealObserver';
import { StoreSync } from '@/components/StoreSync';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { authEnabled } from '@/lib/auth-config';
import { getCatalog } from '@/lib/catalog';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';
import { heroItalic, sans, script, serif } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: { type: 'website', siteName: SITE_NAME, title: SITE_NAME, description: SITE_DESCRIPTION, locale: 'en_IN' },
  twitter: { card: 'summary_large_image', title: SITE_NAME, description: SITE_DESCRIPTION },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The pieces on sale, for the client-side bag, wishlist, quick view and search.
  const catalog = await getCatalog();
  const collectionLinks = catalog.collections.map((c) => ({ slug: c.slug, title: c.title }));
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
      <head>
        {/* Decides, before the first paint, whether the opening title plays (see Intro). */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      </head>
      <body>
        <Intro />
        <CatalogProvider products={catalog.products} collections={collectionLinks} freeShipping={catalog.settings.freeShippingThreshold}>
        {/* Accounts and sessions (Clerk). All screens are the site's own; Clerk supplies
            sign-in, verification emails, password resets and the secure session cookie. */}
        <AuthEnabledProvider enabled={authEnabled}>
          {authEnabled ? (
            <ClerkProvider signInUrl="/login" signUpUrl="/login" afterSignOutUrl="/">
              {children}
              <Footer />
              {/* Saves the bag and wishlist to the signed-in customer's account. */}
              <StoreSync />
            </ClerkProvider>
          ) : (
            <>
              {children}
              <Footer />
            </>
          )}
        </AuthEnabledProvider>
        {/* Slide-out panels opened from anywhere: the bag after an add, and quick view. */}
        <MiniBag />
        <QuickView />
        <CookieConsent />
        <RevealObserver />
        <ServiceWorkerRegister />
        </CatalogProvider>
      </body>
    </html>
  );
}
