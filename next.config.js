const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['playwright']
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle playwright for client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'playwright': false,
      }
    }
    return config
  }
}

module.exports = withNextIntl(nextConfig)