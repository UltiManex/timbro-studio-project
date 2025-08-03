
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
   serverActions: {
    bodySizeLimit: '25mb', // Default is 1mb, increase for audio data
    // Increase the timeout for long-running actions like audio mixing.
    // Default is 60s. This sets it to 5 minutes.
    executionTimeout: 300, 
  },
  webpack: (config, { isServer }) => {
    // This is to prevent a build error with the @ffmpeg-installer/ffmpeg package.
    // It tells Webpack to not bundle this package and treat it as an external module.
    if (isServer) {
      config.externals.push({
        '@ffmpeg-installer/ffmpeg': 'commonjs @ffmpeg-installer/ffmpeg',
      });
    }

    return config;
  },
};

export default withSentryConfig(
  nextConfig,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,
    
    // Un-comment the following lines to enable source map uploading during build.
    // You'll need to set the `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN`
    // environment variables for this to work.
    // org: process.env.SENTRY_ORG,
    // project: process.env.SENTRY_PROJECT,
    // authToken: process.env.SENTRY_AUTH_TOKEN,
  },
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
