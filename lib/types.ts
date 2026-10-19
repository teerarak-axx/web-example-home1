export type Settings = Record<string, string>;
export interface Hero {
  id: number;
  image_url: string;
  title: string;
  subtitle: string;
  alt_text: string;
  sort_order: number;
  is_active: number;
}
export interface Service {
  id: number;
  title_th: string;
  title_en: string;
  description_th: string;
  full_content_th: string;
  image_url: string;
  alt_text: string;
  sort_order: number;
}
export interface Project {
  id: number;
  title: string;
  category: string;
  description: string;
  location: string;
  cover_thumb_url: string;
  cover_full_url: string;
  is_featured_on_home: number;
  sort_order: number;
  created_at: string;
  image_count?: number;
}
export interface ProjectImage {
  id: number;
  project_id: number;
  thumb_url: string;
  full_url: string;
  alt_text: string;
  caption: string;
  width: number;
  height: number;
  sort_order: number;
}
export interface Team {
  id: number;
  name: string;
  role: string;
  image_url: string;
  alt_text: string;
  sort_order: number;
}
export interface SiteData {
  settings: Settings;
  hero_slides: Hero[];
  services: Service[];
  projects: Project[];
  team_members: Team[];
}
export const categories: Record<string, string> = {
  'landscape-construction': 'จัดสวนและพรรณไม้',
  'home-extension': 'เดคไม้ ระแนง และหลังคา',
  '3d-design': 'พื้นทางเดินและงานระบบ',
  maintenance: 'มุมพักผ่อนและศาลา',
};
export function categoryLabels(settings: Settings) {
  return {
    'landscape-construction': settings.category_landscape || categories['landscape-construction'],
    'home-extension': settings.category_extension || categories['home-extension'],
    '3d-design': settings.category_design || categories['3d-design'],
    maintenance: settings.category_maintenance || categories.maintenance,
  } as Record<string, string>;
}
