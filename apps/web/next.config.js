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
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.mapbox.com https://js.stripe.com blob:",
              "style-src 'self' 'unsafe-inline' https://api.mapbox.com https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://*.supabase.co https://*.mapbox.com https://*.stripe.com",
              "font-src 'self' https://fonts.gstatic.com https://api.mapbox.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.mapbox.com https://api.mapbox.com https://events.mapbox.com https://api.stripe.com",
              "worker-src 'self' blob:",
              "child-src blob:",
              "frame-src https://js.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
