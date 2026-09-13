import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get('country') || '';
    const universityId = searchParams.get('universityId') || '';

    const where: Prisma.CrmScholarshipWhereInput = { status: 'active' };

    if (country) {
      where.university = {
        country: { contains: country },
      };
    }

    if (universityId) {
      where.universityId = universityId;
    }

    const scholarships = await db.crmScholarship.findMany({
      where,
      include: {
        university: {
          select: {
            universityId: true,
            name: true,
            country: true,
            city: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = scholarships.map((s) => ({
      id: s.id,
      universityId: s.universityId,
      courseId: s.courseId,
      scholarshipName: s.scholarshipName,
      scholarshipAmount: s.scholarshipAmount,
      scholarshipCurrency: s.scholarshipCurrency,
      university: s.university,
    }));

    return NextResponse.json({
      scholarships: result,
      total: result.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}