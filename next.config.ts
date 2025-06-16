import type {NextConfig} from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  sentry: {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,
    // Note: Reporting source maps is enabled in `sentry.client.config.ts` and `sentry.server.config.ts`
    // org: process.env.SENTRY_ORG, // Optional: configure if you want to upload source maps during build time
    // project: process.env.SENTRY_PROJECT, // Optional: configure if you want to upload source maps during build time
    // authToken: process.env.SENTRY_AUTH_TOKEN, // Optional: configure if you want to upload source maps during build time
  },
};

export default withSentryConfig(
  nextConfig,
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload source maps to Sentry
    widenClientFileUpload: true,

    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: false,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
    // Consider commenting out if not needed or if it causes issues.
    // tunnelRoute: "/monitoring", 

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors.
    automaticVercelMonitors: true,
  }
);
