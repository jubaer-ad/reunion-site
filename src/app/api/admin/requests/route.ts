import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { full_name, email, phone, reason } = await request.json();

    if (!full_name || !full_name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    await pool.query(
      `INSERT INTO admin_requests (full_name, email, phone, reason) VALUES ($1, $2, $3, $4)`,
      [full_name.trim(), email || null, phone || null, reason || null]
    );

    return NextResponse.json({ ok: true, message: 'Admin request submitted' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to submit admin request' }, { status: 500 });
  }
}
