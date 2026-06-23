import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const result = await getDb().query(
      `SELECT * FROM reunion_participants ORDER BY created_at DESC`
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
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
      `INSERT INTO reunion_participants (
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
        special_request
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
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
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create participant' }, { status: 500 });
  }
}
