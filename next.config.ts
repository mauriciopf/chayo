import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['ffmpeg-static'],
  outputFileTracingIncludes: {
    '/api/instagram/automate': [
      './lib/video/fonts/**/*',
      './node_modules/ffmpeg-static/ffmpeg',
      './node_modules/ffmpeg-static/**/*',
      './node_modules/.pnpm/ffmpeg-static@*/node_modules/ffmpeg-static/**/*',
    ],
  },
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
