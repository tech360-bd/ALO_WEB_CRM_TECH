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

    const [scholarships, contentScholarships] = await Promise.all([
      db.crmScholarship.findMany({
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
      }),
      // Keep the existing CRM scholarship contract while also exposing the
      // verified content directory through the same public catalog endpoint.
      universityId
        ? Promise.resolve([])
        : db.scholarship.findMany({
            where: {
              status: { in: ['OPEN', 'CLOSED'] },
              ...(country ? { countrySlug: country } : {}),
            },
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              slug: true,
              name: true,
              countrySlug: true,
              fundingType: true,
              amount: true,
              currency: true,
              eligibility: true,
              deadline: true,
              applicationUrl: true,
              status: true,
            },
          }).catch(() => []),
    ]);

    const result = [
      ...scholarships.map((s) => ({
        id: s.id,
        universityId: s.universityId,
        courseId: s.courseId,
        scholarshipName: s.scholarshipName,
        scholarshipAmount: s.scholarshipAmount,
        scholarshipCurrency: s.scholarshipCurrency,
        university: s.university,
      })),
      ...contentScholarships.map((s) => ({
        id: s.id,
        slug: s.slug,
        title: s.name,
        name: s.name,
        scholarshipName: s.name,
        country: s.countrySlug,
        coverageType: s.fundingType,
        amount: s.amount,
        awardAmount: s.amount,
        currency: s.currency,
        eligibility: s.eligibility,
        description: s.eligibility,
        deadline: s.deadline,
        officialUrl: s.applicationUrl,
        status: s.status,
      })),
    ];

    return NextResponse.json({
      scholarships: result,
      total: result.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}