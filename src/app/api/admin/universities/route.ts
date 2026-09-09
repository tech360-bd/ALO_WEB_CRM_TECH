import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const search = searchParams.get('search') || '';
      const country = searchParams.get('country') || '';
      const status = searchParams.get('status') || '';
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
      const skip = (page - 1) * limit;

      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { universityId: { contains: search } },
          { city: { contains: search } },
        ];
      }
      if (country && country !== 'all') where.country = { contains: country };
      if (status && status !== 'all') where.status = status;

      const [total, universities] = await Promise.all([
        db.crmUniversity.count({ where }),
        db.crmUniversity.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: { courses: true, scholarshipRecords: true },
            },
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        data: universities,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const isAuthorized = auth.roles.some((r) => ['SUPER_ADMIN', 'ADMIN', 'super_admin', 'admin'].includes(r));
      if (!isAuthorized) {
        return NextResponse.json({ success: false, error: 'UNAUTHORIZED: Admin authority required' }, { status: 403 });
      }

      const body = await req.json();
      const {
        universityId,
        name,
        country,
        city,
        campusName,
        campuses,
        website,
        officialUrl,
        sourceUrl,
        ranking,
        worldRanking,
        type,
        founded,
        students,
        intlStudents,
        ieltsMin,
        tuitionRange,
        scholarships,
        description,
        status,
        forceCreate,
      } = body;

      if (!name || !country) {
        return NextResponse.json({ success: false, error: 'University name and country are required' }, { status: 400 });
      }

      const normalizedName = name.trim().toLowerCase();
      const existing = await db.crmUniversity.findFirst({
        where: {
          OR: [
            { name: { contains: normalizedName } },
            website ? { website: { contains: website.replace(/^https?:\/\//, '').split('/')[0] } } : undefined,
            universityId ? { universityId } : undefined,
          ].filter(Boolean) as any,
        },
      });

      if (existing && !forceCreate) {
        return NextResponse.json({
          success: false,
          duplicateDetected: true,
          existingUniversity: {
            id: existing.id,
            universityId: existing.universityId,
            name: existing.name,
            country: existing.country,
            website: existing.website,
          },
          error: `Possible duplicate detected: '${existing.name}' (${existing.country}) already exists.`,
        }, { status: 409 });
      }

      const genCode = universityId || `UNI-${Date.now().toString(36).toUpperCase()}`;
      const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

      const newUni = await db.crmUniversity.create({
        data: {
          universityId: genCode,
          name,
          slug,
          country,
          city: city || '',
          campusName: campusName || 'Main Campus',
          campuses: typeof campuses === 'string' ? campuses : JSON.stringify(campuses || [campusName || 'Main Campus']),
          website: website || '',
          officialUrl: officialUrl || website || '',
          sourceUrl: sourceUrl || '',
          ranking: ranking || 0,
          worldRanking: worldRanking || 0,
          type: type || 'Public',
          founded: founded || 0,
          students: students || '',
          intlStudents: intlStudents || '',
          ieltsMin: ieltsMin || 6.0,
          tuitionRange: tuitionRange || '',
          scholarships: scholarships || false,
          description: description || '',
          status: status || 'verified',
          verificationStatus: sourceUrl ? 'VERIFIED' : 'NEEDS_REVIEW',
          lastVerifiedAt: new Date().toISOString(),
        },
      });

      await db.crmAuditLog.create({
        data: {
          actorUserId: auth.userId || 'system',
          actorRole: auth.roles[0] || 'ADMIN',
          action: 'CREATE_UNIVERSITY',
          targetCollection: 'CrmUniversity',
          targetId: newUni.id,
          afterData: JSON.stringify({ name, country, code: genCode }),
        },
      }).catch(() => null);

      return NextResponse.json({ success: true, data: newUni });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed to create university' }, { status: 500 });
    }
  })(request);
}
