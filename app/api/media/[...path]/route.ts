import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { localMediaPath } from '@/lib/media';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path;
  const file = localMediaPath('/api/media/' + parts.join('/'));
  if (!file) return new Response('Not found', { status: 404 });
  try {
    const info = await stat(file);
    if (!info.isFile()) return new Response('Not found', { status: 404 });
    const etag = `"${parts[1]}-${info.size}"`;
    const headers = {
      'Content-Type': 'image/webp',
      'Content-Length': String(info.size),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      ETag: etag,
    };
    if (req.headers.get('if-none-match') === etag)
      return new Response(null, {
        status: 304,
        headers: { ETag: etag, 'Cache-Control': headers['Cache-Control'] },
      });
    return new Response(Readable.toWeb(createReadStream(file)) as ReadableStream, { headers });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
