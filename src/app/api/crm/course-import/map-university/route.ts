import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { csvUniversityId, csvUniversityName, action, existingUniversityId } = body;

    if (!csvUniversityId || !csvUniversityName || !action) {
      return NextResponse.json(
        { error: 'csvUniversityId, csvUniversityName, and action are required' },
        { status: 400 }
      );
    }

    if (!['map_existing', 'create_new', 'block'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be one of: map_existing, create_new, block' },
        { status: 400 }
      );
    }

    if (action === 'map_existing' && !existingUniversityId) {
      return NextResponse.json(
        { error: 'existingUniversityId is required when action is map_existing' },
        { status: 400 }
      );
    }

    if (action === 'map_existing') {
      // Verify the existing university exists
      const existing = await db.crmUniversity.findUnique({
        where: { universityId: existingUniversityId },
      });

      if (!existing) {
        return NextResponse.json(
          { error: `University with ID "${existingUniversityId}" not found` },
          { status: 404 }
        );
      }

      // Create a mapping entry - we store this as an alias entry
      // Since there's no separate mapping table, we create a CrmSourceLog
      await db.crmSourceLog.create({
        data: {
          universityId: csvUniversityId,
          courseId: '',
          sourceUrl: `mapping:${existingUniversityId}`,
          verifiedBy: 'system',
          status: 'mapped',
        },
      });

      // Create audit log
      await db.crmAuditLog.create({
        data: {
          actorUserId: '',
          actorRole: 'system',
          action: 'university_mapped',
          targetCollection: 'CrmUniversity',
          targetId: existingUniversityId,
          beforeData: JSON.stringify({ csvUniversityId, csvUniversityName }),
          afterData: JSON.stringify({ mappedTo: existingUniversityId, name: existing.name }),
        },
      });

      return NextResponse.json({
        success: true,
        action: 'mapped',
        csvUniversityId,
        mappedToUniversityId: existingUniversityId,
        mappedToUniversityName: existing.name,
      });
    }

    if (action === 'create_new') {
      // Check if it already exists
      const existing = await db.crmUniversity.findUnique({
        where: { universityId: csvUniversityId },
      });

      if (existing) {
        return NextResponse.json(
          { error: `University with ID "${csvUniversityId}" already exists` },
          { status: 409 }
        );
      }

      await db.crmUniversity.create({
        data: {
          universityId: csvUniversityId,
          name: csvUniversityName,
          status: 'needs_official_source',
        },
      });

      await db.crmAuditLog.create({
        data: {
          actorUserId: '',
          actorRole: 'system',
          action: 'university_created',
          targetCollection: 'CrmUniversity',
          targetId: csvUniversityId,
          afterData: JSON.stringify({ name: csvUniversityName, status: 'needs_official_source' }),
        },
      });

      return NextResponse.json({
        success: true,
        action: 'created',
        universityId: csvUniversityId,
        universityName: csvUniversityName,
      });
    }

    if (action === 'block') {
      // Store the blocked ID in source log
      await db.crmSourceLog.create({
        data: {
          universityId: csvUniversityId,
          courseId: '',
          sourceUrl: 'blocked',
          verifiedBy: 'system',
          status: 'blocked',
        },
      });

      await db.crmAuditLog.create({
        data: {
          actorUserId: '',
          actorRole: 'system',
          action: 'university_blocked',
          targetCollection: 'CrmUniversity',
          targetId: csvUniversityId,
          beforeData: JSON.stringify({ name: csvUniversityName }),
        },
      });

      return NextResponse.json({
        success: true,
        action: 'blocked',
        universityId: csvUniversityId,
        universityName: csvUniversityName,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
  }, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN'] })(request);
}