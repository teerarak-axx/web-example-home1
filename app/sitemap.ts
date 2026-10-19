import type { MetadataRoute } from 'next';
import { getSettings } from '@/lib/db';
export const dynamic = 'force-dynamic';
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: getSettings().canonical_url || process.env.SITE_URL || 'http://localhost:3000',
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
