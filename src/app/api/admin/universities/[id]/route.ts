import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, auth) => {
    try {
      const { id } = await params;
      const university = await db.crmUniversity.findFirst({
        where: {
          OR: [{ id }, { universityId: id }, { slug: id }],
        },
        include: {
          rankingRecords: true,
          scholarshipRecords: true,
          courses: {
            take: 50,
            include: {
              intakeFees: true,
              requirements: true,
            },
          },
        },
      });

      if (!university) {
        return NextResponse.json({ success: false, error: 'University not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: university });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
    }
  })(request);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, auth) => {
    try {
      const isAuthorized = auth.roles.some((r) => ['SUPER_ADMIN', 'ADMIN', 'super_admin', 'admin'].includes(r));
      if (!isAuthorized) {
        return NextResponse.json({ success: false, error: 'UNAUTHORIZED: Admin authority required' }, { status: 403 });
      }

      const { id } = await params;
      const body = await req.json();

      const existing = await db.crmUniversity.findFirst({
        where: { OR: [{ id }, { universityId: id }] },
      });

      if (!existing) {
        return NextResponse.json({ success: false, error: 'University not found' }, { status: 404 });
      }

      const updated = await db.crmUniversity.update({
        where: { id: existing.id },
        data: {
          name: body.name !== undefined ? body.name : existing.name,
          country: body.country !== undefined ? body.country : existing.country,
          city: body.city !== undefined ? body.city : existing.city,
          campusName: body.campusName !== undefined ? body.campusName : existing.campusName,
          website: body.website !== undefined ? body.website : existing.website,
          officialUrl: body.officialUrl !== undefined ? body.officialUrl : existing.officialUrl,
          sourceUrl: body.sourceUrl !== undefined ? body.sourceUrl : existing.sourceUrl,
          ranking: body.ranking !== undefined ? body.ranking : existing.ranking,
          worldRanking: body.worldRanking !== undefined ? body.worldRanking : existing.worldRanking,
          type: body.type !== undefined ? body.type : existing.type,
          ieltsMin: body.ieltsMin !== undefined ? body.ieltsMin : existing.ieltsMin,
          tuitionRange: body.tuitionRange !== undefined ? body.tuitionRange : existing.tuitionRange,
          scholarships: body.scholarships !== undefined ? body.scholarships : existing.scholarships,
          description: body.description !== undefined ? body.description : existing.description,
          status: body.status !== undefined ? body.status : existing.status,
          verificationStatus: body.sourceUrl ? 'VERIFIED' : existing.verificationStatus,
          lastVerifiedAt: new Date().toISOString(),
        },
      });

      await db.crmAuditLog.create({
        data: {
          actorUserId: auth.userId || 'system',
          actorRole: auth.roles[0] || 'ADMIN',
          action: 'UPDATE_UNIVERSITY',
          targetCollection: 'CrmUniversity',
          targetId: existing.id,
          beforeData: JSON.stringify({ name: existing.name, status: existing.status }),
          afterData: JSON.stringify({ name: updated.name, status: updated.status }),
        },
      }).catch(() => null);

      return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed to update university' }, { status: 500 });
    }
  })(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, auth) => {
    try {
      const isSuperAdmin = auth.roles.some((r) => ['SUPER_ADMIN', 'super_admin'].includes(r));
      if (!isSuperAdmin) {
        return NextResponse.json({ success: false, error: 'UNAUTHORIZED: Super Admin authority required' }, { status: 403 });
      }

      const { id } = await params;
      const existing = await db.crmUniversity.findFirst({
        where: { OR: [{ id }, { universityId: id }] },
      });

      if (!existing) {
        return NextResponse.json({ success: false, error: 'University not found' }, { status: 404 });
      }

      const archived = await db.crmUniversity.update({
        where: { id: existing.id },
        data: { status: 'archived', publicationStatus: 'archived' },
      });

      await db.crmAuditLog.create({
        data: {
          actorUserId: auth.userId || 'system',
          actorRole: auth.roles[0] || 'SUPER_ADMIN',
          action: 'ARCHIVE_UNIVERSITY',
          targetCollection: 'CrmUniversity',
          targetId: existing.id,
          beforeData: JSON.stringify({ name: existing.name, status: existing.status }),
          afterData: JSON.stringify({ status: 'archived' }),
        },
      }).catch(() => null);

      return NextResponse.json({ success: true, message: 'University archived successfully', data: archived });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed to archive university' }, { status: 500 });
    }
  })(request);
}
