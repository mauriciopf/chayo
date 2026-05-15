import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['ffmpeg-static'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'scontent.cdninstagram.com',
      },
      {
        protocol: 'https',
        hostname: '**.cdninstagram.com',
      },
    ],
  },
};

export default nextConfig;
