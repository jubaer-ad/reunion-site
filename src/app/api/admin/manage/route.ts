import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentAdmin, hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || admin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [requestsRes, adminsRes] = await Promise.all([
      pool.query('SELECT id, full_name, email, phone, reason, status, created_at FROM admin_requests ORDER BY created_at DESC'),
      pool.query('SELECT id, username, role, is_active, created_at FROM admin_users ORDER BY created_at DESC'),
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
      await pool.query(
        'INSERT INTO admin_users (username, password_hash, role, is_active) VALUES ($1, $2, $3, TRUE)',
        [username, hash, role === 'super_admin' ? 'super_admin' : 'admin']
      );
      return NextResponse.json({ ok: true, message: 'Admin created' });
    }

    if (action === 'toggle_admin') {
      if (!targetId) {
        return NextResponse.json({ error: 'Target admin is required' }, { status: 400 });
      }

      await pool.query('UPDATE admin_users SET is_active = $1 WHERE id = $2', [Boolean(isActive), targetId]);
      return NextResponse.json({ ok: true, message: 'Admin status updated' });
    }

    if (action === 'delete_admin') {
      if (!targetId) {
        return NextResponse.json({ error: 'Target admin is required' }, { status: 400 });
      }

      await pool.query('DELETE FROM admin_users WHERE id = $1', [targetId]);
      return NextResponse.json({ ok: true, message: 'Admin removed' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to manage admins' }, { status: 500 });
  }
}
