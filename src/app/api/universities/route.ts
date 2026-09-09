import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const country = searchParams.get('country') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.CrmUniversityWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { city: { contains: search } },
        { universityId: { contains: search } },
        { country: { contains: search } },
      ];
    }

    if (country) {
      where.country = { contains: country };
    }

    const [total, universities] = await Promise.all([
      db.crmUniversity.count({ where }),
      db.crmUniversity.findMany({
        where,
        select: {
          universityId: true,
          name: true,
          country: true,
          city: true,
          campusName: true,
          ranking: true,
          worldRanking: true,
          type: true,
          founded: true,
          students: true,
          ieltsMin: true,
          scholarships: true,
          featured: true,
          website: true,
          status: true,
          logoSourceUrl: true,
          heroImageSourceUrl: true,
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
    ]);

    // Get course counts for each university
    const courseCounts = await db.crmCourse.groupBy({
      by: ['universityId'],
      _count: { id: true },
    });
    const courseCountMap = new Map(courseCounts.map((c) => [c.universityId, c._count.id]));

    const result = universities.map((uni) => ({
      ...uni,
      courseCount: courseCountMap.get(uni.universityId) || 0,
    }));

    return NextResponse.json({
      universities: result,
      total,
      page,
      limit,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}