import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import * as XLSX from 'xlsx';

type ParticipantRow = {
  id: string;
  name: string;
  batch: number;
  profession: string | null;
  profession_other: string | null;
  guest_count: number;
  guest_details: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  district: string | null;
  address: string | null;
  notes: string | null;
  special_request: string | null;
  created_at: string;
};

export async function GET() {
  try {
    const result = await getDb().query(`SELECT * FROM reunion_participants ORDER BY created_at DESC`);

    const rows = result.rows.map((row: ParticipantRow) => ({
      id: row.id,
      নাম: row.name,
      ব্যাচ: row.batch,
      পেশা: row.profession || row.profession_other || '—',
      অতিথির_সংখ্যা: row.guest_count,
      অতিথির_বিস্তারিত: row.guest_details || '—',
      ফোন: row.contact_phone || '—',
      ইমেইল: row.contact_email || '—',
      জেলা: row.district || '—',
      ঠিকানা: row.address || '—',
      নোট: row.notes || '—',
      বিশেষ_অনুরোধ: row.special_request || '—',
      তৈরি_তারিখ: row.created_at,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Participants');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="reunion-participants.xlsx"',
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to export participants' }, { status: 500 });
  }
}
