const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['playwright-core', '@sparticuz/chromium']
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle playwright-core and chromium for client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'playwright-core': false,
        '@sparticuz/chromium': false,
      }
    }
    return config
  }
}

module.exports = withNextIntl(nextConfig)