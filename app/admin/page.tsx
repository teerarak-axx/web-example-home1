import Admin from '@/components/admin';
import { isAdmin } from '@/lib/auth';
import { getSettings } from '@/lib/db';
import type { Metadata } from 'next';
import './admin.css';
export const dynamic = 'force-dynamic';
export function generateMetadata(): Metadata {
  const s = getSettings();
  return {
    title: 'จัดการเว็บไซต์ | ' + s.company_name_th,
    robots: { index: false, follow: false },
    icons: { icon: s.favicon_image_url || s.logo_image_url },
  };
}
export default async function AdminPage() {
  return <Admin authenticated={await isAdmin()} branding={getSettings()} />;
}
