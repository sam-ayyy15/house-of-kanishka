import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Keeps the dev badge out of reference-comparison screenshots.
  devIndicators: false,
  // The repo sits on a Windows drive (/mnt/c) under WSL, where file-change events
  // don't arrive. Poll in dev; drop this if the project moves into the WSL filesystem.
  watchOptions: { pollIntervalMs: 1000 },
};

export default nextConfig;
