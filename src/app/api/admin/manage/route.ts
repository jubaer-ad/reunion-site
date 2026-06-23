import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentAdmin, hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || admin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [requestsRes, adminsRes] = await Promise.all([
      getDb().query('SELECT id, full_name, email, phone, reason, status, created_at FROM admin_requests ORDER BY created_at DESC'),
      getDb().query('SELECT id, username, role, is_active, password_reset_required, created_at FROM admin_users ORDER BY created_at DESC'),
    ]);

    return NextResponse.json({ requests: requestsRes.rows, admins: adminsRes.rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load admin management data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || admin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action, targetId, username, password, role, isActive } = body;

    if (action === 'create_admin') {
      if (!username || !password) {
        return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
      }

      const hash = hashPassword(password);
      await getDb().query(
        'INSERT INTO admin_users (username, password_hash, role, is_active) VALUES ($1, $2, $3, TRUE)',
        [username, hash, role === 'super_admin' ? 'super_admin' : 'admin']
      );
      return NextResponse.json({ ok: true, message: 'Admin created' });
    }

    if (action === 'toggle_admin') {
      if (!targetId) {
        return NextResponse.json({ error: 'Target admin is required' }, { status: 400 });
      }

      await getDb().query('UPDATE admin_users SET is_active = $1 WHERE id = $2', [Boolean(isActive), targetId]);
      return NextResponse.json({ ok: true, message: 'Admin status updated' });
    }

    if (action === 'delete_admin') {
      if (!targetId) {
        return NextResponse.json({ error: 'Target admin is required' }, { status: 400 });
      }

      await getDb().query('DELETE FROM admin_users WHERE id = $1', [targetId]);
      return NextResponse.json({ ok: true, message: 'Admin removed' });
    }

    if (action === 'reset_password') {
      if (!targetId) {
        return NextResponse.json({ error: 'Target admin is required' }, { status: 400 });
      }

      const placeholderHash = hashPassword(Math.random().toString(36));
      await getDb().query(
        'UPDATE admin_users SET password_reset_required = TRUE, password_hash = $1 WHERE id = $2',
        [placeholderHash, targetId]
      );
      return NextResponse.json({ ok: true, message: 'Password reset. Admin must set a new password on next login.' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to manage admins' }, { status: 500 });
  }
}
