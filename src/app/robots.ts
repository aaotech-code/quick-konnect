import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/dashboard',
          '/dashboard/',
          '/pro/',
          '/messages',
          '/messages/',
          '/notifications',
          '/api/',
          '/reset-password/',
          '/forgot-password',
        ],
      },
    ],
    sitemap: baseUrl + '/sitemap.xml',
  };
}
