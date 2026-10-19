import { contentFields, contentLabels } from './content';
export const labels: Record<string, string> = {
  ...contentLabels,
  gallery_note: 'หมายเหตุ Gallery (ล้างข้อความได้เมื่อใช้ผลงานจริง)',
  team_note: 'หมายเหตุภาพทีม (ล้างได้เมื่อใช้ทีมจริง)',
  team_intro: 'คำแนะนำทีมงาน',
  team_detail: 'รายละเอียดทีมงาน',
  contact_intro: 'คำเกริ่นช่องทางติดต่อ',
  gallery_eyebrow: 'คำเกริ่น Gallery',
  gallery_intro: 'คำอธิบาย Gallery',
  hero_cta_text: 'ข้อความปุ่ม Hero',
  hero_scroll_text: 'ข้อความเลื่อนลง',
  service_label: 'คำเกริ่นบริการ',
  service_title: 'หัวข้อบริการ',
  instagram_heading: 'หัวข้อ Instagram',
  instagram_handle: 'ชื่อ Instagram',
  contact_photo_title: 'หัวข้อบนภาพติดต่อ',
  contact_photo_subtitle: 'คำโปรยบนภาพติดต่อ',
  company_name_en: 'ชื่อบริษัท (อังกฤษ)',
  company_name_th: 'ชื่อบริษัท (ไทย)',
  projects_badge_text: 'ข้อความปีโครงการ',
  welcome_label: 'คำเกริ่น',
  welcome_title: 'หัวข้อแนะนำ',
  welcome_subtitle: 'คำอธิบายสั้น',
  welcome_body: 'เนื้อหาแนะนำบริษัท',
  welcome_image_url: 'รูปแนะนำบริษัท',
  welcome_button_text: 'ข้อความปุ่มอ่านเพิ่มเติม',
  about_detail: 'รายละเอียดบริษัท / ขั้นตอน / คุณสมบัติ',
  concept_quote_th: 'ข้อความแนวคิด',
  concept_image_url: 'รูปแนวคิด',
  video_banner_title: 'หัวข้อวิดีโอ',
  video_banner_subtitle: 'คำโปรยวิดีโอ',
  youtube_url: 'ลิงก์ YouTube',
  video_cover_url: 'ภาพปกวิดีโอ',
  mission_label: 'ป้าย Mission',
  mission_title: 'หัวข้อ Mission',
  mission_body: 'เนื้อหา Mission',
  mission_video_url: 'ลิงก์วิดีโอ Mission (YouTube)',
  mission_cover_url: 'ภาพปก Mission',
  philosophy_body: 'ปรัชญาการออกแบบ',
  philosophy_bw_image_url: 'ภาพปรัชญา (แสดงขาวดำ)',
  phone_primary: 'เบอร์โทรหลัก',
  phone_secondary: 'เบอร์โทรรอง',
  address_th: 'ที่อยู่ / พื้นที่บริการ',
  email: 'อีเมล',
  google_maps_url: 'ลิงก์ Google Maps',
  line_id: 'LINE ID',
  line_url: 'ลิงก์ LINE',
  facebook_url: 'ลิงก์ Facebook',
  instagram_url: 'ลิงก์ Instagram',
  tiktok_url: 'ลิงก์ TikTok',
  contact_image_url: 'รูปส่วนติดต่อ',
  meta_title: 'Meta Title',
  meta_description: 'Meta Description',
  meta_keywords: 'Meta Keywords',
  og_image_url: 'รูป Open Graph',
  canonical_url: 'Canonical URL (URL เต็ม)',
  hero_eyebrow: 'คำโปรยบน Hero',
  gallery_title: 'หัวข้อ Gallery',
  service_subtitle: 'คำโปรยบริการ',
  team_label: 'คำโปรยทีมงาน',
  team_title: 'หัวข้อทีมงาน',
  contact_label: 'คำเกริ่นติดต่อ',
  contact_title: 'หัวข้อติดต่อ',
  privacy_body: 'นโยบายความเป็นส่วนตัว',
  copyright_text: 'ข้อความลิขสิทธิ์',
  image_url: 'รูปภาพ',
  title: 'ชื่อ / หัวข้อ',
  subtitle: 'คำโปรย',
  alt_text: 'คำอธิบายรูป (Alt text)',
  sort_order: 'ลำดับ (น้อยแสดงก่อน)',
  is_active: 'เปิดใช้งาน',
  title_th: 'ชื่อบริการ (ไทย)',
  title_en: 'ชื่อบริการ (อังกฤษ)',
  description_th: 'คำอธิบายสั้น',
  full_content_th: 'รายละเอียดบริการ',
  name: 'ชื่อทีม / บุคลากร',
  role: 'บทบาท',
  category: 'หมวดหมู่',
  description: 'รายละเอียดโครงการ',
  location: 'สถานที่ / พื้นที่โครงการ',
  is_featured_on_home: 'แนะนำบนหน้าแรก',
  caption: 'คำบรรยายรูป',
};
const coreGroups = [
  [
    'แบรนด์และหน้าแรก',
    [
      'company_name_en',
      'company_name_th',
      'hero_eyebrow',
      'hero_cta_text',
      'hero_scroll_text',
      'projects_badge_text',
    ],
  ],
  [
    'แนะนำบริษัท',
    [
      'welcome_label',
      'welcome_title',
      'welcome_subtitle',
      'welcome_body',
      'welcome_image_url',
      'welcome_button_text',
      'about_detail',
    ],
  ],
  [
    'แนวคิดและวิดีโอ',
    [
      'concept_quote_th',
      'concept_image_url',
      'video_banner_title',
      'video_banner_subtitle',
      'youtube_url',
      'video_cover_url',
    ],
  ],
  [
    'Mission และปรัชญา',
    [
      'mission_label',
      'mission_title',
      'mission_body',
      'mission_video_url',
      'mission_cover_url',
      'philosophy_body',
      'philosophy_bw_image_url',
    ],
  ],
  [
    'บริการ แกลเลอรี และทีมงาน',
    [
      'service_label',
      'service_title',
      'service_subtitle',
      'gallery_eyebrow',
      'gallery_title',
      'gallery_intro',
      'gallery_note',
      'team_label',
      'team_title',
      'team_intro',
      'team_detail',
      'team_note',
    ],
  ],
  [
    'ข้อมูลติดต่อและสื่อสังคม',
    [
      'contact_label',
      'contact_title',
      'contact_intro',
      'contact_photo_title',
      'contact_photo_subtitle',
      'phone_primary',
      'phone_secondary',
      'address_th',
      'email',
      'google_maps_url',
      'line_id',
      'line_url',
      'facebook_url',
      'instagram_url',
      'tiktok_url',
      'contact_image_url',
    ],
  ],
  ['ความเป็นส่วนตัวและลิขสิทธิ์', ['privacy_body', 'copyright_text']],
] as const;
const assignedFields = new Set<string>(coreGroups.flatMap(([, keys]) => [...keys]));
const extraFields = contentFields.filter(([key]) => !assignedFields.has(key));
const extraGroups: [string, string[]][] = [
  [
    'โลโก้และไอคอน',
    extraFields
      .filter(([key]) => key.includes('logo') || key.includes('favicon'))
      .map(([key]) => key),
  ],
  [
    'เปิด/ปิดส่วนต่าง ๆ',
    extraFields.filter(([key]) => key.startsWith('show_')).map(([key]) => key),
  ],
  [
    'เมนูและชื่อหมวดหมู่',
    extraFields
      .filter(([key]) => key.startsWith('nav_') || key.startsWith('category_'))
      .map(([key]) => key),
  ],
  [
    'คำอธิบายรูปภาพ',
    extraFields
      .filter(([key]) => key.endsWith('_alt_text') && !key.includes('logo'))
      .map(([key]) => key),
  ],
];
const assignedExtra = new Set(extraGroups.flatMap(([, keys]) => keys));
extraGroups.push([
  'ข้อความปุ่มและช่องทางเพิ่มเติม',
  extraFields.filter(([key]) => !assignedExtra.has(key)).map(([key]) => key),
]);
export const groups: ReadonlyArray<readonly [string, readonly string[]]> = [
  ...coreGroups,
  ...extraGroups,
];
export const entityFields: Record<string, string[]> = {
  projects: ['title', 'category', 'description', 'location', 'is_featured_on_home', 'sort_order'],
  hero_slides: ['image_url', 'title', 'subtitle', 'alt_text', 'sort_order', 'is_active'],
  services: [
    'image_url',
    'title_th',
    'title_en',
    'description_th',
    'full_content_th',
    'alt_text',
    'sort_order',
  ],
  team_members: ['image_url', 'name', 'role', 'alt_text', 'sort_order'],
};
export const textAreas = new Set([
  'team_intro',
  'team_detail',
  'gallery_intro',
  'contact_photo_title',
  'welcome_body',
  'about_detail',
  'concept_quote_th',
  'mission_title',
  'mission_body',
  'philosophy_body',
  'address_th',
  'privacy_body',
  'description',
  'description_th',
  'full_content_th',
  'meta_description',
]);
export const isImage = (key: string) =>
  key === 'image_url' ||
  key.endsWith('_image_url') ||
  key.endsWith('_cover_url') ||
  key === 'video_cover_url';

export const seoSettingKeys = [
  'meta_title',
  'meta_description',
  'meta_keywords',
  'canonical_url',
  'og_image_url',
];
export const editableSettingKeys = [
  ...new Set([...groups.flatMap(([, keys]) => keys), ...seoSettingKeys]),
];
