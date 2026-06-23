import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    await getDb().query(`
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

    await getDb().query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await getDb().query(`
      ALTER TABLE admin_users
      ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin'
    `);

    await getDb().query(`
      ALTER TABLE admin_users
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE
    `);

    await getDb().query(`
      CREATE TABLE IF NOT EXISTS admin_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        reason TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const superAdminCount = await getDb().query('SELECT COUNT(*) FROM admin_users WHERE role = $1', ['super_admin']);
    if (Number(superAdminCount.rows[0].count) === 0) {
      const defaultPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';
      const hashedPassword = hashPassword(defaultPassword);
      await getDb().query(
        'INSERT INTO admin_users (username, password_hash, role, is_active) VALUES ($1, $2, $3, TRUE)',
        ['superadmin', hashedPassword, 'super_admin']
      );
    }

    return NextResponse.json({ ok: true, message: 'Database ready' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to initialize database' }, { status: 500 });
  }
}
