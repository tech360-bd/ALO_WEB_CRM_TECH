import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const universitiesChecked = await db.crmUniversity.count({ where: { status: 'needs_official_source' } });
    const coursesChecked = await db.crmCourse.count({ where: { status: 'needs_official_source' } });
    
    return NextResponse.json({
      success: true,
      universitiesChecked,
      coursesChecked,
      changesFound: 0,
      updateRequestsCreated: 0
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
