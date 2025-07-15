/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require('next-intl/plugin');
 
const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig = {
  images: {
    unoptimized: true,
  },
  // For Vercel deployment
  trailingSlash: false,
}

module.exports = withNextIntl(nextConfig);
