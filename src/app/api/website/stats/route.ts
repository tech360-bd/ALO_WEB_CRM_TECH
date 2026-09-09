import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [totalUniversities, totalCourses, totalScholarships, countryGroups] = await Promise.all([
      db.crmUniversity.count({ where: { status: 'active' } }),
      db.crmCourse.count(),
      db.crmScholarship.count({ where: { status: 'active' } }),
      db.crmUniversity.groupBy({
        by: ['country'],
        where: { status: 'active' },
        _count: { universityId: true },
      }),
    ]);

    const countryCounts: Record<string, number> = {};
    for (const g of countryGroups) {
      countryCounts[g.country] = g._count.universityId;
    }

    return NextResponse.json({
      totalUniversities,
      totalCourses,
      totalScholarships,
      countryCounts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
