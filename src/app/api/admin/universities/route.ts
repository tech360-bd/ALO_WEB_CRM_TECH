import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { POST as createUniversityDraft } from './create/route';

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    const roles = new Set([auth.userType, ...auth.roles].map((role) => role.toUpperCase()));
    if (!roles.has('SUPER_ADMIN') && !roles.has('ADMIN') && !roles.has('CONTENT_MANAGER')) {
      return NextResponse.json({ success: false, error: 'Admin access is required.' }, { status: 403 });
    }
    try {
      const { searchParams } = new URL(req.url);
      const search = (searchParams.get('search') || '').trim();
      const country = (searchParams.get('country') || '').trim();
      const status = (searchParams.get('status') || '').trim();
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10) || 25));
      const where: any = {};
      if (search) where.OR = [
        { name: { contains: search } },
        { universityId: { contains: search } },
        { city: { contains: search } },
      ];
      if (country && country.toLowerCase() !== 'all') where.country = { contains: country };
      if (status && status.toLowerCase() !== 'all') where.status = status;
      const [total, universities] = await Promise.all([
        db.crmUniversity.count({ where }),
        db.crmUniversity.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { name: 'asc' },
          include: { _count: { select: { courses: true, scholarshipRecords: true } } },
        }),
      ]);
      return NextResponse.json({
        success: true,
        data: universities,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch {
      return NextResponse.json({ success: false, error: 'University records are temporarily unavailable.' }, { status: 503 });
    }
  })(request);
}

// Keep the collection POST endpoint backward-compatible while sharing the same
// server-generated-ID, duplicate, draft-only creation policy as /create.
export async function POST(request: NextRequest) {
  return createUniversityDraft(request);
}
