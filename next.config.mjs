import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // `images.domains` was removed in Next 16 in favor of `remotePatterns`.
  // This app only serves local files from /public, so no remote patterns are needed.
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Turbopack is the default bundler in Next 16. Pin its root to this project so
  // an unrelated lockfile in a parent directory cannot change module resolution.
  turbopack: {
    root: projectRoot,
  },
}

export default nextConfig
