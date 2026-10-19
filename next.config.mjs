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
    '*.run.app',
    '**.run.app',
    'ais-dev-s4vtjacbtcpag6j2m6cf2j-635328116894.asia-southeast1.run.app',
    'ais-pre-s4vtjacbtcpag6j2m6cf2j-635328116894.asia-southeast1.run.app',
    'localhost:3000',
    '127.0.0.1:3000',
  ],
}

export default nextConfig
