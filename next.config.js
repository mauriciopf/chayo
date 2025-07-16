/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require('next-intl/plugin');
 
const withNextIntl = createNextIntlPlugin('./i18n.ts');

const withPWA = require('next-pwa');
const runtimeCaching = require('next-pwa/cache');

const nextConfig = {
  images: {
    unoptimized: true,
  },
  // For Vercel deployment
  trailingSlash: false,
}

module.exports = withNextIntl(withPWA({
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
    runtimeCaching,
    manifest: '/manifest.json',
  },
  // ...existing Next.js config
}));
