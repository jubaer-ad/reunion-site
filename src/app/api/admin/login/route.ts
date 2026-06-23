import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { setSessionCookie, verifyPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const result = await pool.query('SELECT username, password_hash FROM admin_users WHERE username = $1 AND is_active = TRUE', [username]);
    const admin = result.rows[0];

    if (!admin || !verifyPassword(password, admin.password_hash)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true, username: admin.username });
    await setSessionCookie(admin.username);

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
