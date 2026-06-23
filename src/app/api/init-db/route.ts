import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reunion_participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        batch INTEGER NOT NULL,
        profession TEXT,
        profession_other TEXT,
        guest_count INTEGER DEFAULT 0,
        guest_details TEXT,
        contact_phone TEXT,
        contact_email TEXT,
        district TEXT,
        address TEXT,
        notes TEXT,
        special_request TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    return NextResponse.json({ ok: true, message: 'Database ready' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to initialize database' }, { status: 500 });
  }
}
