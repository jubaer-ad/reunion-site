import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { signSession, SESSION_COOKIE, verifyPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const result = await getDb().query(
      'SELECT username, password_hash, role, password_reset_required FROM admin_users WHERE username = $1 AND is_active = TRUE',
      [username]
    );
    const admin = result.rows[0];

    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const needsReset = Boolean(admin.password_reset_required);

    if (needsReset && !password) {
      const token = signSession({ username: admin.username, issuedAt: Date.now() });
      const response = NextResponse.json({ ok: true, username: admin.username, role: admin.role, password_reset_required: true });
      response.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 8,
      });
      return response;
    }

    if (needsReset && password) {
      return NextResponse.json({ error: 'This account requires a password setup. Leave the password field empty and log in with your username only.' }, { status: 401 });
    }

    if (!verifyPassword(password, admin.password_hash)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = signSession({ username: admin.username, issuedAt: Date.now() });
    const response = NextResponse.json({ ok: true, username: admin.username, role: admin.role });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
    });
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
