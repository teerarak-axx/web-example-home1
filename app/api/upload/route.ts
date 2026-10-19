import { db } from '@/lib/db';
import { ApiError, apiError, checkOrigin, requireAdmin, limitedBody } from '@/lib/auth';
import { processImage, queueMedia, drainDeletions, buckets } from '@/lib/media';
import { positiveId } from '@/lib/validation';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  const completed: Awaited<ReturnType<typeof processImage>>[] = [];
  try {
    checkOrigin(req);
    await requireAdmin();
    if (Number(req.headers.get('content-length')) > 31 * 1024 * 1024)
      throw new ApiError('ขนาดคำขอเกิน 31 MB', 413);
    const body = await limitedBody(req, 31 * 1024 * 1024);
    const form = await new Response(body as BodyInit, {
      headers: { 'Content-Type': req.headers.get('content-type') || '' },
    }).formData();
    const files = form.getAll('files').filter((f): f is File => f instanceof File);
    if (!files.length || files.length > 3) throw new ApiError('อัปโหลดได้ครั้งละ 1–3 รูป');
    const bucket = String(form.get('bucket') || 'projects');
    if (!buckets.includes(bucket)) throw new ApiError('ประเภทไม่ถูกต้อง');
    const projectId = bucket === 'projects' ? positiveId(form.get('project_id')) : null;
    if (projectId && !db().prepare('SELECT id FROM projects WHERE id=?').get(projectId))
      throw new ApiError('ไม่พบอัลบั้ม', 404);
    const results = await Promise.allSettled(files.map((file) => processImage(file, bucket)));
    for (const result of results) if (result.status === 'fulfilled') completed.push(result.value);
    const failed = results.find((result) => result.status === 'rejected');
    if (failed?.status === 'rejected')
      throw new ApiError(
        failed.reason instanceof ApiError
          ? failed.reason.message
          : 'ไม่สามารถอ่านรูปได้ กรุณาเลือกไฟล์รูปภาพที่สมบูรณ์',
      );
    if (projectId)
      db().transaction(() => {
        const max = (
          db()
            .prepare('SELECT COALESCE(MAX(sort_order),-1) n FROM project_images WHERE project_id=?')
            .get(projectId) as { n: number }
        ).n;
        completed.forEach((img, i) =>
          db()
            .prepare(
              'INSERT INTO project_images(project_id,thumb_url,full_url,alt_text,caption,width,height,sort_order) VALUES (?,?,?,?,?,?,?,?)',
            )
            .run(
              projectId,
              img.thumb_url,
              img.full_url,
              files[i].name.replace(/\.[^.]+$/, ''),
              '',
              img.width,
              img.height,
              max + i + 1,
            ),
        );
        db()
          .prepare(
            "UPDATE projects SET cover_thumb_url=?,cover_full_url=? WHERE id=? AND cover_thumb_url=''",
          )
          .run(completed[0].thumb_url, completed[0].full_url, projectId);
      })();
    return Response.json({ images: completed }, { status: 201 });
  } catch (error) {
    for (const img of completed) {
      queueMedia(img.full_url);
      queueMedia(img.thumb_url);
    }
    drainDeletions();
    return apiError(error);
  }
}
