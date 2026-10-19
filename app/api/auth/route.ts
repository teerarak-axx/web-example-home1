import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import {
  ApiError,
  apiError,
  checkOrigin,
  jsonBody,
  isAdmin,
  verifyPassword,
  createSession,
  tokenHash,
} from '@/lib/auth';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  return Response.json(
    { authenticated: await isAdmin() },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const { password } = await jsonBody(req);
    if (typeof password !== 'string' || password.length > 256)
      throw new ApiError('รหัสผ่านไม่ถูกต้อง');
    const key =
      process.env.TRUST_PROXY === 'true'
        ? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'global'
        : 'global';
    const now = Date.now();
    db().prepare('DELETE FROM login_attempts WHERE reset_at<?').run(now);
    const attempt = db().prepare('SELECT count FROM login_attempts WHERE key=?').get(key) as
      { count: number } | undefined;
    if (attempt && attempt.count >= 10)
      throw new ApiError('ลองเข้าสู่ระบบมากเกินไป กรุณารอ 15 นาที', 429);
    const { admin_password_hash } = db()
      .prepare('SELECT admin_password_hash FROM site_settings WHERE id=1')
      .get() as { admin_password_hash: string };
    if (!verifyPassword(password, admin_password_hash)) {
      db()
        .prepare(
          'INSERT INTO login_attempts VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1',
        )
        .run(key, now + 900000);
      throw new ApiError('รหัสผ่านไม่ถูกต้อง', 401);
    }
    db().prepare('DELETE FROM login_attempts WHERE key=?').run(key);
    await createSession();
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE(req: Request) {
  try {
    checkOrigin(req);
    const jar = await cookies();
    const token = jar.get('nayture_session')?.value;
    if (token) db().prepare('DELETE FROM sessions WHERE token_hash=?').run(tokenHash(token));
    jar.delete('nayture_session');
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
