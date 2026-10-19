import './public-site.css';
import type { Metadata } from 'next';
import { getSiteData, getSettings } from '@/lib/db';
import Site from '@/components/site';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function generateMetadata(): Promise<Metadata> {
  const s = getSettings();
  const base = s.canonical_url || process.env.SITE_URL || 'http://localhost:3000';
  return {
    metadataBase: new URL(base),
    title: s.meta_title,
    description: s.meta_description,
    keywords: s.meta_keywords,
    icons: { icon: s.favicon_image_url || s.logo_image_url, apple: s.logo_image_url },
    alternates: { canonical: base },
    openGraph: {
      type: 'website',
      locale: 'th_TH',
      siteName: s.company_name_en,
      title: s.meta_title,
      description: s.meta_description,
      url: base,
      images: s.og_image_url ? [{ url: s.og_image_url }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: s.meta_title,
      description: s.meta_description,
      images: s.og_image_url ? [s.og_image_url] : [],
    },
  };
}
export default function Page() {
  const data = getSiteData();
  const s = data.settings;
  const structured = {
    '@context': 'https://schema.org',
    '@type': ['HomeAndConstructionBusiness', 'LocalBusiness'],
    name: s.company_name_en,
    alternateName: s.company_name_th,
    url: s.canonical_url || process.env.SITE_URL || 'http://localhost:3000',
    telephone: s.phone_primary,
    image: s.og_image_url,
    areaServed: s.service_area,
    address: { '@type': 'PostalAddress', addressCountry: 'TH', streetAddress: s.address_th },
    sameAs: [s.line_url, s.facebook_url, s.instagram_url, s.tiktok_url].filter(Boolean),
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\u003c') }}
      />
      <Site data={data} />
    </>
  );
}
