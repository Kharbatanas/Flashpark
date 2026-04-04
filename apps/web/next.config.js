/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@flashpark/ui',
    '@flashpark/api',
    '@flashpark/db',
    '@flashpark/utils',
  ],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['postgres'],
  },
}

module.exports = nextConfig
