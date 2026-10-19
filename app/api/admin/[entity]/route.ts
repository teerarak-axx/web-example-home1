import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { db, getSettings, albumImages } from '@/lib/db';
import {
  ApiError,
  apiError,
  requireAdmin,
  checkOrigin,
  jsonBody,
  verifyPassword,
  hashPassword,
} from '@/lib/auth';
import { validate, fields, positiveId } from '@/lib/validation';
import { diskUsage, queueMedia, drainDeletions, cleanupUnusedMedia } from '@/lib/media';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ entity: string }> };
const mediaKeys = ['image_url', 'thumb_url', 'full_url', 'cover_thumb_url', 'cover_full_url'];
export async function GET(req: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { entity } = await params;
    const headers = { 'Cache-Control': 'no-store' };
    if (entity === 'settings') return Response.json(getSettings(), { headers });
    if (entity === 'dashboard') {
      drainDeletions();
      return Response.json(
        {
          projects: (db().prepare('SELECT COUNT(*) n FROM projects').get() as { n: number }).n,
          images: (db().prepare('SELECT COUNT(*) n FROM project_images').get() as { n: number }).n,
          bytes: diskUsage(),
          local_images: (db().prepare('SELECT COUNT(*) n FROM media_assets').get() as { n: number })
            .n,
        },
        { headers },
      );
    }
    if (entity === 'backup') {
      const file = path.join(tmpdir(), 'baanpoo-' + randomUUID() + '.sqlite');
      try {
        await db().backup(file);
        const data = await fs.readFile(file);
        return new Response(data, {
          headers: {
            ...headers,
            'Content-Type': 'application/vnd.sqlite3',
            'Content-Disposition': `attachment; filename="baanpoo-${new Date().toISOString().slice(0, 10)}.sqlite"`,
          },
        });
      } finally {
        await fs.rm(file, { force: true });
      }
    }
    if (entity === 'project_images') {
      const id = positiveId(new URL(req.url).searchParams.get('project_id'));
      return Response.json(albumImages(id), { headers });
    }
    if (!fields[entity]) throw new ApiError('ไม่พบข้อมูล', 404);
    return Response.json(db().prepare(`SELECT * FROM ${entity} ORDER BY sort_order,id`).all(), {
      headers,
    });
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(req: Request, { params }: Context) {
  try {
    checkOrigin(req);
    await requireAdmin();
    const { entity } = await params;
    const body = await jsonBody(req);
    if (entity === 'reorder') {
      const projectId = positiveId(body.project_id);
      const ids = body.ids;
      if (!Array.isArray(ids) || ids.length > 10000) throw new ApiError('ลำดับไม่ถูกต้อง');
      const normalized = ids.map(positiveId);
      const existing = albumImages(projectId).map((i) => i.id);
      if (
        new Set(normalized).size !== existing.length ||
        normalized.length !== existing.length ||
        existing.some((id) => !normalized.includes(id))
      )
        throw new ApiError('รายการรูปเปลี่ยนไป กรุณาโหลดใหม่');
      db().transaction(() => {
        normalized.forEach((id, index) =>
          db()
            .prepare('UPDATE project_images SET sort_order=? WHERE id=? AND project_id=?')
            .run(index, id, projectId),
        );
      })();
      return Response.json({ ok: true });
    }
    if (entity === 'cleanup') return Response.json({ ok: true, removed: cleanupUnusedMedia() });
    if (entity === 'password') {
      const { current_password, new_password } = body;
      if (
        typeof current_password !== 'string' ||
        typeof new_password !== 'string' ||
        current_password.length > 256 ||
        new_password.length < 12 ||
        new_password.length > 256
      )
        throw new ApiError('รหัสผ่านใหม่ต้องมี 12–256 ตัวอักษร');
      const row = db()
        .prepare('SELECT admin_password_hash FROM site_settings WHERE id=1')
        .get() as { admin_password_hash: string };
      if (!verifyPassword(current_password, row.admin_password_hash))
        throw new ApiError('รหัสผ่านปัจจุบันไม่ถูกต้อง', 400);
      db().transaction(() => {
        db()
          .prepare('UPDATE site_settings SET admin_password_hash=? WHERE id=1')
          .run(hashPassword(new_password));
        db().prepare('DELETE FROM sessions').run();
      })();
      return Response.json({ ok: true, relogin: true });
    }
    if (!fields[entity] || entity === 'project_images')
      throw new ApiError('ไม่สามารถสร้างข้อมูลประเภทนี้', 404);
    const data = validate(body, entity);
    const titleKey =
      entity === 'services' ? 'title_th' : entity === 'team_members' ? 'name' : 'title';
    if (!String(data[titleKey] || '').trim()) throw new ApiError('กรุณากรอกชื่อ');
    const keys = Object.keys(data);
    const result = db()
      .prepare(
        `INSERT INTO ${entity} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`,
      )
      .run(...Object.values(data));
    return Response.json({ id: Number(result.lastInsertRowid) }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
export async function PATCH(req: Request, { params }: Context) {
  try {
    checkOrigin(req);
    await requireAdmin();
    const { entity } = await params;
    const body = await jsonBody(req);
    const id = entity === 'settings' ? 1 : positiveId(body.id);
    const table = entity === 'settings' ? 'site_settings' : entity;
    if (entity !== 'settings' && !fields[entity]) throw new ApiError('ไม่พบข้อมูล', 404);
    const before = db().prepare(`SELECT * FROM ${table} WHERE id=?`).get(id) as
      Record<string, string | number> | undefined;
    if (!before) throw new ApiError('ไม่พบข้อมูล', 404);
    if (entity === 'projects' && body.cover_image_id) {
      const img = db()
        .prepare('SELECT * FROM project_images WHERE id=? AND project_id=?')
        .get(positiveId(body.cover_image_id), id) as
        { thumb_url: string; full_url: string } | undefined;
      if (!img) throw new ApiError('รูปไม่ได้อยู่ในอัลบั้มนี้');
      body.cover_thumb_url = img.thumb_url;
      body.cover_full_url = img.full_url;
    }
    const data = validate(body, entity);
    db().transaction(() => {
      db()
        .prepare(
          `UPDATE ${table} SET ${Object.keys(data)
            .map((k) => k + '=?')
            .join(',')} WHERE id=?`,
        )
        .run(...Object.values(data), id);
      for (const key of Object.keys(data))
        if (typeof before[key] === 'string' && before[key] !== data[key])
          queueMedia(String(before[key]));
    })();
    drainDeletions();
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE(req: Request, { params }: Context) {
  try {
    checkOrigin(req);
    await requireAdmin();
    const { entity } = await params;
    if (!fields[entity]) throw new ApiError('ไม่พบข้อมูล', 404);
    const id = positiveId(new URL(req.url).searchParams.get('id'));
    const row = db().prepare(`SELECT * FROM ${entity} WHERE id=?`).get(id) as
      Record<string, string | number> | undefined;
    if (!row) throw new ApiError('ไม่พบข้อมูล', 404);
    db().transaction(() => {
      if (entity === 'projects')
        for (const img of albumImages(id)) {
          queueMedia(img.thumb_url);
          queueMedia(img.full_url);
        }
      db().prepare(`DELETE FROM ${entity} WHERE id=?`).run(id);
      if (entity === 'project_images') {
        const replacement = db()
          .prepare(
            'SELECT thumb_url,full_url FROM project_images WHERE project_id=? ORDER BY sort_order,id LIMIT 1',
          )
          .get(row.project_id) as { thumb_url: string; full_url: string } | undefined;
        db()
          .prepare(
            'UPDATE projects SET cover_thumb_url=?,cover_full_url=? WHERE id=? AND (cover_thumb_url=? OR cover_full_url=?)',
          )
          .run(
            replacement?.thumb_url || '',
            replacement?.full_url || '',
            row.project_id,
            row.thumb_url,
            row.full_url,
          );
      }
      for (const key of mediaKeys) if (row[key]) queueMedia(String(row[key]));
    })();
    drainDeletions();
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
