import { NextResponse } from 'next/server';
import { COURSE_COLUMNS } from '@/lib/crm/import-constants';

export async function GET() {
  const csv = COURSE_COLUMNS.join(',');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="course_import_template.csv"',
    },
  });
}
