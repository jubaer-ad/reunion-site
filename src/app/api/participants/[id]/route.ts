import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      batch,
      profession,
      profession_other,
      guest_count,
      guest_details,
      contact_phone,
      contact_email,
      district,
      address,
      notes,
      special_request,
    } = body;

    const result = await getDb().query(
      `UPDATE reunion_participants SET
        name = $1,
        batch = $2,
        profession = $3,
        profession_other = $4,
        guest_count = $5,
        guest_details = $6,
        contact_phone = $7,
        contact_email = $8,
        district = $9,
        address = $10,
        notes = $11,
        special_request = $12
      WHERE id = $13 RETURNING *`,
      [
        name,
        batch,
        profession || null,
        profession_other || null,
        guest_count || 0,
        guest_details || null,
        contact_phone || null,
        contact_email || null,
        district || null,
        address || null,
        notes || null,
        special_request || null,
        id,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update participant' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const result = await getDb().query('DELETE FROM reunion_participants WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete participant' }, { status: 500 });
  }
}
