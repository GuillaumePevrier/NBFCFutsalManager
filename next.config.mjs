
import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
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
      {
        protocol: 'https',
        hostname: 'futsal.noyalbrecefc.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  customWorkerSrc: 'public',
  customWorkerDest: 'public',
  buildExcludes: [/app-build-manifest.json$/],
  publicExcludes: ['!noprecache/**/*', '!_next/static/chunks/pages/_app-*.js', '!_next/static/chunks/webpack-*.js'],
  workboxOptions: {
    // This is a crucial step: we are injecting the VAPID public key
    // into the service worker's environment.
    buildId: process.env.BUILD_ID || 'dev', // ensures a new service worker is generated on each build
    define: {
      'process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY': JSON.stringify(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
    },
  },
});

export default pwaConfig(nextConfig);
