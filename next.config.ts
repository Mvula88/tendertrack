import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Exclude canvas-dependent packages from bundling
  serverExternalPackages: ['canvas', 'pdf-parse'],
  // Disable static optimization for all pages to prevent SSR issues
  output: 'standalone',
}

export default nextConfig
