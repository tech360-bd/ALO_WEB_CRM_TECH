import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    if (['STUDENT', 'PARTNER'].includes(auth.userType.toUpperCase()) || !auth.roles.some((role) => ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'COUNSELOR'].includes(role.toUpperCase()))) {
      return NextResponse.json({ success: false, error: 'Staff required' }, { status: 403 });
    }
    const params = new URL(req.url).searchParams;
    const search = (params.get('search') || '').trim();
    const country = (params.get('country') || '').trim();
    const universityId = (params.get('universityId') || '').trim();
    const page = Number(params.get('page') || '1');
    const limit = Number(params.get('limit') || '24');
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100 || search.length > 200 || country.length > 100 || universityId.length > 191) {
      return NextResponse.json({ success: false, error: 'Invalid catalogue query' }, { status: 400 });
    }
    try {
      if (universityId) {
        const university = await db.crmUniversity.findUnique({ where: { universityId }, include: {
          _count: { select: { courses: true, campusRecords: true, rankingRecords: true, scholarshipRecords: true, requirements: true, intakeFees: true } },
          courses: { take: 50, orderBy: { courseTitle: 'asc' } },
          campusRecords: { take: 50 }, rankingRecords: { take: 50 }, scholarshipRecords: { take: 50 }, requirements: { take: 50 }, intakeFees: { take: 50 },
        } });
        if (!university) return NextResponse.json({ success: false, error: 'University not found' }, { status: 404 });
        return NextResponse.json({ success: true, university, relatedRecordLimit: 50, evidenceNotice: 'Stored CRM information, not proof of complete university research. Review verification status and official sources.' });
      }
      const where = {
        ...(search ? { OR: [{ name: { contains: search } }, { universityId: { contains: search } }, { city: { contains: search } }] } : {}),
        ...(country && country !== 'all' ? { country: { contains: country } } : {}),
      };
      const [total, universities] = await Promise.all([
        db.crmUniversity.count({ where }),
        db.crmUniversity.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: [{ name: 'asc' }, { universityId: 'asc' }], include: { _count: { select: { courses: true } } } }),
      ]);
      return NextResponse.json({ success: true, universities, data: universities, total, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch {
      return NextResponse.json({ success: false, error: 'University information is temporarily unavailable' }, { status: 503 });
    }
  })(request);
}
