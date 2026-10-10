/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    '**.run.app',
    'ais-dev-cb76xhdo2pnh32xyg4bjps-725478499877.asia-southeast1.run.app',
    'ais-pre-cb76xhdo2pnh32xyg4bjps-725478499877.asia-southeast1.run.app',
    'localhost:3000',
    '127.0.0.1:3000',
  ],
}

export default nextConfig
