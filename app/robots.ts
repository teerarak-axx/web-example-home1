import type { MetadataRoute } from 'next';
import { getSettings } from '@/lib/db';
export const dynamic = 'force-dynamic';
export default function robots(): MetadataRoute.Robots {
  const base = (
    getSettings().canonical_url ||
    process.env.SITE_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] },
    sitemap: base + '/sitemap.xml',
  };
}
