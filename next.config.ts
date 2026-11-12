import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Keeps the dev badge out of reference-comparison screenshots.
  devIndicators: false,
  // The repo sits on a Windows drive (/mnt/c) under WSL, where file-change events
  // don't arrive. Poll in dev; drop this if the project moves into the WSL filesystem.
  watchOptions: { pollIntervalMs: 1000 },
  // The three customer-care pages were merged into /help.
  async redirects() {
    return [
      { source: '/shipping-returns', destination: '/help#shipping', permanent: true },
      { source: '/size-guide', destination: '/help#size-guide', permanent: true },
      { source: '/contact', destination: '/help#support', permanent: true },
    ];
  },
};

export default nextConfig;
