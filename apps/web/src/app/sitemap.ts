import { db, spots } from '@flashpark/db'
import { eq } from 'drizzle-orm'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://flashpark.fr'

  const activeSpots = await db.query.spots.findMany({
    where: eq(spots.status, 'active'),
    columns: { id: true, updatedAt: true },
  })

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/map`, lastModified: new Date(), changeFrequency: 'always', priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/host`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    ...activeSpots.map((spot) => ({
      url: `${baseUrl}/spot/${spot.id}`,
      lastModified: spot.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
  ]
}
