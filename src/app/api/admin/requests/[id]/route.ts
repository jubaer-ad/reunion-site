import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentAdmin, hashPassword } from '@/lib/auth';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || admin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, role } = body;

    if (action === 'approve') {
      const requestRow = await getDb().query('SELECT full_name, email, phone, reason FROM admin_requests WHERE id = $1', [id]);
      const requestData = requestRow.rows[0];
      if (!requestData) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 });
      }

      const username = requestData.email || requestData.full_name.replace(/\s+/g, '').toLowerCase();
      const password = `${requestData.full_name.replace(/\s+/g, '').toLowerCase()}123!`;
      const hashed = hashPassword(password);
      const roleValue = role === 'super_admin' ? 'super_admin' : 'admin';

      await getDb().query(
        `INSERT INTO admin_users (username, password_hash, role, is_active)
         VALUES ($1, $2, $3, TRUE)
         ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, is_active = TRUE`,
        [username, hashed, roleValue]
      );

      await getDb().query('UPDATE admin_requests SET status = $1 WHERE id = $2', ['approved', id]);
      return NextResponse.json({ ok: true, username, password });
    }

    if (action === 'reject') {
      await getDb().query('UPDATE admin_requests SET status = $1 WHERE id = $2', ['rejected', id]);
      return NextResponse.json({ ok: true, message: 'Request rejected' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update admin request' }, { status: 500 });
  }
}
