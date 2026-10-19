import { cookies } from 'next/headers';
import { createHash, randomBytes } from 'node:crypto';
import { db } from './db';
import { verifyPassword, hashPassword } from './password';
export { verifyPassword, hashPassword };
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
export async function isAdmin() {
  const token = (await cookies()).get('nayture_session')?.value;
  if (!token) return false;
  return !!db()
    .prepare('SELECT token_hash FROM sessions WHERE token_hash=? AND expires_at>?')
    .get(tokenHash(token), Date.now());
}
export async function requireAdmin() {
  if (!(await isAdmin())) throw new ApiError('กรุณาเข้าสู่ระบบ', 401);
}
export async function createSession() {
  const token = randomBytes(32).toString('hex');
  db().prepare('DELETE FROM sessions WHERE expires_at<?').run(Date.now());
  db()
    .prepare('INSERT INTO sessions VALUES (?,?)')
    .run(tokenHash(token), Date.now() + 8 * 60 * 60 * 1000);
  (await cookies()).set('nayture_session', token, {
    httpOnly: true,
    secure:
      process.env.COOKIE_SECURE === 'true' ||
      (process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false'),
    sameSite: 'strict',
    path: '/',
    maxAge: 28800,
  });
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function checkOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) throw new ApiError('Origin ไม่ถูกต้อง', 403);
  if (process.env.SITE_URL) {
    if (origin !== new URL(process.env.SITE_URL).origin)
      throw new ApiError('Origin ไม่ถูกต้อง', 403);
    return;
  }
  if (process.env.NODE_ENV === 'production')
    throw new ApiError('กรุณาตั้งค่า SITE_URL บนเซิร์ฟเวอร์', 503);
  // Next's internal URL may use 0.0.0.0 in development; validate the browser's Host.
  let incoming: URL;
  try {
    incoming = new URL(origin);
  } catch {
    throw new ApiError('Origin ไม่ถูกต้อง', 403);
  }
  if (!['http:', 'https:'].includes(incoming.protocol) || incoming.host !== req.headers.get('host'))
    throw new ApiError('Origin ไม่ถูกต้อง', 403);
}
export async function limitedBody(req: Request, max: number) {
  if (Number(req.headers.get('content-length')) > max)
    throw new ApiError('ขนาดข้อมูลเกินที่กำหนด', 413);
  const reader = req.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        await reader.cancel();
        throw new ApiError('ขนาดข้อมูลเกินที่กำหนด', 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}
export async function jsonBody(req: Request) {
  if (!req.headers.get('content-type')?.includes('application/json'))
    throw new ApiError('ต้องส่ง JSON', 415);
  const data = Buffer.from(await limitedBody(req, 131072)).toString('utf8');
  if (Buffer.byteLength(data) > 131072) throw new ApiError('ข้อมูลใหญ่เกินไป', 413);
  try {
    const value = JSON.parse(data);
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new ApiError('ต้องส่งข้อมูลเป็น object');
    return value;
  } catch {
    throw new ApiError('JSON ไม่ถูกต้อง');
  }
}
export function apiError(error: unknown) {
  if (error instanceof ApiError)
    return Response.json({ error: error.message }, { status: error.status });
  console.error(error);
  return Response.json(
    { error: 'ไม่สามารถดำเนินการได้ กรุณาลองใหม่หรือตรวจสอบ server log' },
    { status: 500 },
  );
}
