import type { MetadataRoute } from 'next';
import { db } from '@/server/db/client';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: baseUrl + '/services', lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: baseUrl + '/providers', lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: baseUrl + '/how-it-works', lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: baseUrl + '/about', lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: baseUrl + '/login', lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: baseUrl + '/register', lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: baseUrl + '/legal/terms', lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: baseUrl + '/legal/privacy', lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: baseUrl + '/legal/disputes', lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  try {
    const categories = await db.serviceCategory.findMany({
      where: { isActive: true },
      select: { slug: true, createdAt: true },
    });

    const providers = await db.providerProfile.findMany({
      select: { slug: true, createdAt: true },
      take: 5000,
    });

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
      url: baseUrl + '/services/' + c.slug,
      lastModified: c.createdAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    const providerRoutes: MetadataRoute.Sitemap = providers.map((p) => ({
      url: baseUrl + '/provider/' + p.slug,
      lastModified: p.createdAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    return [...staticRoutes, ...categoryRoutes, ...providerRoutes];
  } catch {
    return staticRoutes;
  }
}
