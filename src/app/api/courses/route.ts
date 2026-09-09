import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const university = searchParams.get('university') || '';
    const studyLevel = searchParams.get('studyLevel') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const where: any = {};
    if (search) where.courseTitle = { contains: search };
    if (university) where.universityId = university;
    if (studyLevel) where.studyLevel = studyLevel;

    const [total, courses] = await Promise.all([
      db.crmCourse.count({ where }),
      db.crmCourse.findMany({ where, skip: (page - 1) * limit, take: limit })
    ]);

    return NextResponse.json({ success: true, data: courses, meta: { total, page, limit } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
