import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://flashpark.fr'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard', '/host/', '/profile', '/booking/', '/notifications'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
