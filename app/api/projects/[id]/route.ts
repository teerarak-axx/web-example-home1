import { db, albumImages } from '@/lib/db';
export const dynamic = 'force-dynamic';
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0)
    return Response.json({ error: 'ไม่พบอัลบั้ม' }, { status: 404 });
  const project = db().prepare('SELECT * FROM projects WHERE id=?').get(id);
  if (!project) return Response.json({ error: 'ไม่พบอัลบั้ม' }, { status: 404 });
  return Response.json(
    { project, images: albumImages(id) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
