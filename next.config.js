/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // For Vercel deployment
  trailingSlash: false,
}

module.exports = nextConfig
