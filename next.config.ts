import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/instagram/automate': ['./lib/video/fonts/**/*', './lib/video/bin/ffmpeg'],
    '/api/xai/grok-imagine-video-extend': ['./lib/video/bin/ffmpeg'],
    '/api/xai/video-compose': ['./lib/video/bin/ffmpeg'],
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
