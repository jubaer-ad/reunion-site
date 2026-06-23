import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ isAdmin: false });
    }

    return NextResponse.json({ isAdmin: true, username: admin.username, role: admin.role, passwordResetRequired: admin.passwordResetRequired });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to resolve session' }, { status: 500 });
  }
}
