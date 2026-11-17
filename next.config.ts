import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Keeps the dev badge out of reference-comparison screenshots.
  devIndicators: false,
  // The repo sits on a Windows drive (/mnt/c) under WSL, where file-change events
  // don't arrive. Poll in dev; drop this if the project moves into the WSL filesystem.
  watchOptions: { pollIntervalMs: 1000 },
  // Security headers for every page; and the service worker must always be fetched fresh, so
  // a new version reaches visitors at once.
  async headers() {
    // Pages that belong to one person: never stored by shared caches, never indexed.
    const privatePage = [
      { key: 'Cache-Control', value: 'private, no-store' },
      { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
    ];
    return [
      {
        // Every response. The referrer rule matters most: private order links carry a token in
        // the address, and this keeps the full address from being sent to other websites.
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      { source: '/order/:path*', headers: privatePage },
      { source: '/account/:path*', headers: privatePage },
      // (/admin is left out on purpose: a rule here would show that the address exists.
      //  Its pages are never cached and carry their own noindex.)
      { source: '/checkout', headers: privatePage },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
  // Two older customer-care pages were merged into /help. (/contact is a page of its own again.)
  async redirects() {
    return [
      { source: '/shipping-returns', destination: '/help#shipping', permanent: true },
      { source: '/size-guide', destination: '/help#size-guide', permanent: true },
    ];
  },
};

export default nextConfig;
