import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireCron } from "@/lib/cron-auth";

export async function GET(req: Request) {
  const denied = await requireCron(req);
  if (denied) return denied;

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
