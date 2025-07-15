/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require('next-intl/plugin');
 
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  images: {
    unoptimized: true,
  },
  // For Vercel deployment
  trailingSlash: false,
}

module.exports = withNextIntl(nextConfig);
