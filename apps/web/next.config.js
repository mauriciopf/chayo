const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Only check TypeScript files in the current directory
    ignoreBuildErrors: false,
  },
  // Exclude mobile app from compilation
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  experimental: {
    // Ensure we don't compile files outside this app
    externalDir: false,
  },
}

module.exports = withNextIntl(nextConfig)