import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { signSession, SESSION_COOKIE, verifyPassword } from '@/lib/auth';

function setAuthCookie(response: NextResponse, username: string) {
  const token = signSession({ username, issuedAt: Date.now() });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const result = await getDb().query(
      'SELECT username, password_hash, role, password_reset_required, temp_password_expires_at FROM admin_users WHERE username = $1 AND is_active = TRUE',
      [username]
    );
    const admin = result.rows[0];

    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const needsReset = Boolean(admin.password_reset_required);

    if (!verifyPassword(password, admin.password_hash)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (needsReset) {
      const expiresAt = admin.temp_password_expires_at ? new Date(admin.temp_password_expires_at) : null;
      if (expiresAt && expiresAt < new Date()) {
        return NextResponse.json({ error: 'Temporary password expired. Please contact the Super Admin.' }, { status: 401 });
      }

      const response = NextResponse.json({
        ok: true,
        username: admin.username,
        role: admin.role,
        password_reset_required: true,
      });
      setAuthCookie(response, admin.username);
      return response;
    }

    const response = NextResponse.json({ ok: true, username: admin.username, role: admin.role });
    setAuthCookie(response, admin.username);
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
