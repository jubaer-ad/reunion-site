import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { setSessionCookie, verifyPassword } from '@/lib/auth';

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
      const response = NextResponse.json({ ok: true, username: admin.username, role: admin.role, password_reset_required: true });
      await setSessionCookie(admin.username);
      return response;
    }

    if (needsReset && password) {
      return NextResponse.json({ error: 'This account requires a password setup. Leave the password field empty and log in with your username only.' }, { status: 401 });
    }

    if (!verifyPassword(password, admin.password_hash)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true, username: admin.username, role: admin.role });
    await setSessionCookie(admin.username);

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
