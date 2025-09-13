const createNextIntlPlugin = require('next-intl/plugin');
const path = require('path');
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
  // Transpile workspace packages
  transpilePackages: ['@chayo/config', '@chayo/formio'],
  // Load environment variables from the monorepo root
  env: {
    // This will make Next.js look for .env files in the parent directory
    ...require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') }).parsed,
  },
}

module.exports = withNextIntl(nextConfig)