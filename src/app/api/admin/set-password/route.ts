import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentAdmin, hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { newPassword } = await request.json();
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 });
    }

    const hashed = hashPassword(newPassword);
    await getDb().query(
      'UPDATE admin_users SET password_hash = $1, password_reset_required = FALSE WHERE username = $2',
      [hashed, admin.username]
    );

    return NextResponse.json({ ok: true, message: 'Password set successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to set password' }, { status: 500 });
  }
}
