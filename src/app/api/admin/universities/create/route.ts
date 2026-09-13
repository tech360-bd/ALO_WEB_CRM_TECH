import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

// POST /api/admin/universities/create — Manual University form per spec section 26
export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    const isAuthorized = auth.roles.some((r) => ['SUPER_ADMIN', 'ADMIN', 'super_admin', 'admin'].includes(r));
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Admin required' }, { status: 403 });

    const body = await req.json();
    const { universityId, name, country, city, campusName, campuses, website, officialUrl, officialInternationalAdmissionsUrl, officialCourseSearchUrl, officialTuitionFeeUrl, officialScholarshipUrl, ranking, worldRanking, type, founded, students, intlStudents, ieltsMin, tuitionRange, scholarships, description, overview, sourceUrl, lastVerifiedAt, verificationStatus = 'NEEDS_REVIEW', publicationStatus = 'draft', seoTitle, seoDescription, canonicalUrl, status = 'verified', forceCreate } = body;

    if (!name || !country) return NextResponse.json({ success: false, error: 'University name and country required' }, { status: 400 });

    // Duplicate check
    if (!forceCreate) {
      const existing = await db.crmUniversity.findFirst({ where: { OR: [{ name: { contains: name } }, { universityId: universityId || '' }] } });
      if (existing) return NextResponse.json({ success: false, error: `Possible duplicate: ${existing.name} already exists`, duplicateDetected: true, existingUniversity: { id: existing.id, name: existing.name } }, { status: 409 });
    }

    const genCode = universityId || `UNI-${Date.now().toString(36).toUpperCase()}`;
    const slug = body.slug || name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

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
        officialInternationalAdmissionsUrl: officialInternationalAdmissionsUrl || '',
        officialCourseSearchUrl: officialCourseSearchUrl || '',
        officialTuitionFeeUrl: officialTuitionFeeUrl || '',
        officialScholarshipUrl: officialScholarshipUrl || '',
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
        description: description || overview || '',
        verificationStatus,
        publicationStatus,
        lastVerifiedAt: lastVerifiedAt || new Date().toISOString(),
        status: status || 'verified',
      },
    });

    await db.crmAuditLog.create({
      data: {
        actorUserId: auth.userId,
        actorRole: auth.roles[0] || 'ADMIN',
        action: 'CREATE_UNIVERSITY',
        targetCollection: 'CrmUniversity',
        targetId: newUni.id,
        afterData: JSON.stringify({ name, country, code: genCode }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: newUni, university: newUni });
  })(request);
}

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    return NextResponse.json({ success: true, message: 'Use POST to create university with Basic Information, International Information, Content, Verification, SEO, Visibility, Audit per spec section 26' });
  })(request);
}
