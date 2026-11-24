import type {NextConfig} from 'next';
import {PHASE_DEVELOPMENT_SERVER} from 'next/constants';

export default function nextConfig(phase: string): NextConfig {
  return {
    distDir:
      phase === PHASE_DEVELOPMENT_SERVER
        ? 'node_modules/.cache/next-dev'
        : '.next',
    reactStrictMode: true,
    eslint: {
      ignoreDuringBuilds: true,
    },
    typescript: {
      ignoreBuildErrors: false,
    },
    // Allow access to remote image placeholder.
    images: {
      unoptimized: process.env.STATIC_EXPORT === '1',
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'picsum.photos',
          port: '',
          pathname: '/**', // This allows any path under the hostname
        },
      ],
    },
    // STATIC_EXPORT=1 builds a static site for GitHub Pages (smash.forthexp.com); online play talks to the
    // play-api Worker (smash-api.forthexp.com), so no Node server is needed.
    output: process.env.STATIC_EXPORT === '1' ? 'export' : 'standalone',
    transpilePackages: ['motion'],
    webpack: (config, {dev}) => {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      if (dev && process.env.DISABLE_HMR === 'true') {
        config.watchOptions = {
          ignored: /.*/,
        };
      }
      return config;
    },
  };
}
