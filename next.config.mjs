/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    '**.run.app',
    'ais-dev-m6gdbi5crjt24tweina5dk-295074508516.asia-southeast1.run.app',
    'ais-pre-m6gdbi5crjt24tweina5dk-295074508516.asia-southeast1.run.app',
    'localhost:3000',
    '127.0.0.1:3000',
  ],
}

export default nextConfig
