import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { db, storageRoot } from './db';
import { ApiError } from './auth';
export const buckets = ['hero', 'sections', 'services', 'projects', 'team'];
export function localMediaPath(url: string) {
  const match =
    /^\/api\/media\/(hero|sections|services|projects|team)\/((?:thumb|full)_[a-f0-9-]{36}\.webp)$/.exec(
      url,
    );
  if (!match) return null;
  return path.join(storageRoot, 'uploads', match[1], match[2]);
}
export async function processImage(file: File, bucket: string) {
  if (!buckets.includes(bucket)) throw new ApiError('ประเภทไฟล์ไม่ถูกต้อง');
  if (file.size > 10 * 1024 * 1024 || !file.size) throw new ApiError('รูปต้องมีขนาดไม่เกิน 10 MB');
  const buffer = Buffer.from(await file.arrayBuffer());
  const pipeline = sharp(buffer, {
    limitInputPixels: 60_000_000,
    failOn: 'error',
    animated: false,
  }).rotate();
  const metadata = await pipeline.metadata();
  if (!['jpeg', 'png', 'webp', 'avif', 'heif', 'tiff'].includes(metadata.format || ''))
    throw new ApiError('รองรับ JPEG, PNG, WebP, AVIF และ TIFF');
  const uuid = randomUUID(),
    dir = path.join(storageRoot, 'uploads', bucket);
  fs.mkdirSync(dir, { recursive: true });
  const thumb = `/api/media/${bucket}/thumb_${uuid}.webp`,
    full = `/api/media/${bucket}/full_${uuid}.webp`;
  const thumbPath = localMediaPath(thumb)!,
    fullPath = localMediaPath(full)!;
  try {
    const thumbResult = await pipeline
      .clone()
      .resize({ width: 640, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(thumbPath);
    void thumbResult;
    const result = await pipeline
      .clone()
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(fullPath);
    db()
      .prepare('INSERT INTO media_assets VALUES (?,?,?,?)')
      .run(full, thumb, result.width, result.height);
    return { thumb_url: thumb, full_url: full, width: result.width, height: result.height };
  } catch (error) {
    for (const p of [thumbPath, fullPath])
      if (fs.existsSync(/* turbopackIgnore: true */ p)) fs.unlinkSync(p);
    throw error;
  }
}
export function queueMedia(url: string) {
  if (!localMediaPath(url)) return;
  const asset = db()
    .prepare('SELECT * FROM media_assets WHERE full_url=? OR thumb_url=?')
    .get(url, url) as { full_url: string; thumb_url: string } | undefined;
  for (const u of asset ? [asset.full_url, asset.thumb_url] : [url])
    db().prepare('INSERT OR IGNORE INTO file_deletions(url) VALUES (?)').run(u);
}
function isReferenced(url: string) {
  const d = db();
  const references = [
    ['hero_slides', ['image_url']],
    ['services', ['image_url']],
    ['team_members', ['image_url']],
    ['projects', ['cover_thumb_url', 'cover_full_url']],
    ['project_images', ['thumb_url', 'full_url']],
  ] as const;
  for (const [table, columns] of references)
    if (
      d
        .prepare(
          `SELECT 1 FROM ${table} WHERE ${columns.map((c) => c + '=?').join(' OR ')} LIMIT 1`,
        )
        .get(...columns.map(() => url))
    )
      return true;
  const settings = d.prepare('SELECT * FROM site_settings WHERE id=1').get() as Record<
    string,
    unknown
  >;
  return Object.values(settings).includes(url);
}
export function drainDeletions() {
  for (const { url } of db().prepare('SELECT url FROM file_deletions').all() as { url: string }[]) {
    const asset = db()
      .prepare('SELECT * FROM media_assets WHERE full_url=? OR thumb_url=?')
      .get(url, url) as { full_url: string; thumb_url: string } | undefined;
    if (
      isReferenced(url) ||
      (asset && (isReferenced(asset.full_url) || isReferenced(asset.thumb_url)))
    ) {
      db().prepare('DELETE FROM file_deletions WHERE url=?').run(url);
      continue;
    }
    try {
      const p = localMediaPath(url);
      if (p) fs.rmSync(p, { force: true });
      db().prepare('DELETE FROM file_deletions WHERE url=?').run(url);
      if (
        asset &&
        !fs.existsSync(localMediaPath(asset.full_url)!) &&
        !fs.existsSync(localMediaPath(asset.thumb_url)!)
      )
        db().prepare('DELETE FROM media_assets WHERE full_url=?').run(asset.full_url);
    } catch (error) {
      console.error('Media cleanup deferred', error);
    }
  }
}
export function diskUsage(dir = path.join(storageRoot, 'uploads')): number {
  if (!fs.existsSync(/* turbopackIgnore: true */ dir)) return 0;
  return fs
    .readdirSync(/* turbopackIgnore: true */ dir, { withFileTypes: true })
    .reduce(
      (sum, e) =>
        sum +
        (e.isDirectory()
          ? diskUsage(path.join(dir, e.name))
          : e.isFile()
            ? fs.statSync(path.join(dir, e.name)).size
            : 0),
      0,
    );
}

/** Remove only unreferenced uploads older than 24h, protecting forms still being edited. */
export function cleanupUnusedMedia() {
  let count = 0;
  for (const asset of db().prepare('SELECT full_url,thumb_url FROM media_assets').all() as {
    full_url: string;
    thumb_url: string;
  }[]) {
    const p = localMediaPath(asset.full_url);
    if (!p || isReferenced(asset.full_url) || isReferenced(asset.thumb_url)) continue;
    try {
      if (fs.statSync(/* turbopackIgnore: true */ p).mtimeMs > Date.now() - 86400000) continue;
    } catch {}
    queueMedia(asset.full_url);
    count++;
  }
  drainDeletions();
  return count;
}
