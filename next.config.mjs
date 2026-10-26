/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        pathname: '/**',
      },
    ],
  },
  allowedDevOrigins: [
    '*.run.app',
    '**.run.app',
    '*.asia-southeast1.run.app',
    'ais-dev-eot7ahl5bmrhqplehgc6bd-46101734976.asia-southeast1.run.app',
    'ais-pre-eot7ahl5bmrhqplehgc6bd-46101734976.asia-southeast1.run.app',
    'ais-dev-m5espaqw6oo2im7axvr3oh-8306156675.asia-southeast1.run.app',
    'ais-pre-m5espaqw6oo2im7axvr3oh-8306156675.asia-southeast1.run.app',
    'ais-dev-s4vtjacbtcpag6j2m6cf2j-635328116894.asia-southeast1.run.app',
    'ais-pre-s4vtjacbtcpag6j2m6cf2j-635328116894.asia-southeast1.run.app',
    'ais-dev-wiph6sj3w3u3jmlbahzvcp-8306156675.asia-southeast1.run.app',
    'ais-pre-wiph6sj3w3u3jmlbahzvcp-8306156675.asia-southeast1.run.app',
    'localhost:3000',
    '127.0.0.1:3000',
  ],
}

export default nextConfig
