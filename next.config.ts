
/** @type {import('next').NextConfig} */

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // Exclure les fichiers OneSignal du cache PWA pour garantir qu'ils sont toujours
  // récupérés depuis le réseau, ce qui résout les erreurs 404 sur Vercel.
  workboxExcludes: [/OneSignalSDKWorker\.js$/, /OneSignalSDKUpdaterWorker\.js$/]
});


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

module.exports = withPWA(nextConfig);
