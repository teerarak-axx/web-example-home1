import { ApiError } from './auth';
import { defaults } from './seed';
import { categories } from './types';
export const fields: Record<string, string[]> = {
  hero_slides: ['image_url', 'title', 'subtitle', 'alt_text', 'sort_order', 'is_active'],
  services: [
    'title_th',
    'title_en',
    'description_th',
    'full_content_th',
    'image_url',
    'alt_text',
    'sort_order',
  ],
  projects: [
    'title',
    'category',
    'description',
    'location',
    'cover_thumb_url',
    'cover_full_url',
    'is_featured_on_home',
    'sort_order',
  ],
  team_members: ['name', 'role', 'image_url', 'alt_text', 'sort_order'],
  project_images: ['alt_text', 'caption', 'sort_order'],
};
export function validate(data: unknown, entity: string) {
  if (!data || typeof data !== 'object' || Array.isArray(data))
    throw new ApiError('ข้อมูลไม่ถูกต้อง');
  const allowed = entity === 'settings' ? Object.keys(defaults) : fields[entity];
  if (!allowed) throw new ApiError('ไม่พบข้อมูล', 404);
  const result: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(data)) {
    if (!allowed.includes(key)) continue;
    if (['sort_order', 'is_active', 'is_featured_on_home'].includes(key)) {
      if (
        !Number.isInteger(value) ||
        Number(value) < 0 ||
        Number(value) > 1000000 ||
        (['is_active', 'is_featured_on_home'].includes(key) && Number(value) > 1)
      )
        throw new ApiError('ลำดับหรือสถานะไม่ถูกต้อง');
      result[key] = value as number;
      continue;
    }
    if (key.startsWith('show_') && !['0', '1'].includes(String(value)))
      throw new ApiError('สถานะแสดงผลไม่ถูกต้อง');
    if (typeof value !== 'string' || value.length > 20000)
      throw new ApiError('ข้อความไม่ถูกต้องหรือยาวเกินไป');
    if ((key.endsWith('_url') || key.endsWith('_image_url')) && value) {
      if (/^\/brand\/baanpoo\/[a-z0-9-]+\.webp$/.test(value)) {
        /* bundled business image */
      } else if (!value.startsWith('/api/media/')) {
        let u: URL;
        try {
          u = new URL(value);
        } catch {
          throw new ApiError('URL ไม่ถูกต้อง: ' + key);
        }
        if (!['https:', 'http:'].includes(u.protocol))
          throw new ApiError('URL ต้องเป็น http/https');
      } else if (
        !/^\/api\/media\/(hero|sections|services|projects|team)\/(thumb|full)_[a-f0-9-]{36}\.webp$/.test(
          value,
        )
      )
        throw new ApiError('URL รูปภาพไม่ถูกต้อง');
    }
    if (key === 'category' && !categories[value]) throw new ApiError('หมวดหมู่ไม่ถูกต้อง');
    if (['phone_primary', 'phone_secondary'].includes(key) && !/^[+()0-9 .-]{0,40}$/.test(value))
      throw new ApiError('เบอร์โทรศัพท์ไม่ถูกต้อง');
    if (key === 'canonical_url' && value && !/^https?:\/\//.test(value))
      throw new ApiError('Canonical ต้องเป็น URL เต็ม');
    if (key === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      throw new ApiError('อีเมลไม่ถูกต้อง');
    result[key] = value;
  }
  if (!Object.keys(result).length) throw new ApiError('ไม่มีข้อมูลที่แก้ไขได้');
  return result;
}
export function positiveId(value: unknown) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n <= 0) throw new ApiError('รหัสไม่ถูกต้อง');
  return n;
}
