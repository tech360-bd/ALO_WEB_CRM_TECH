import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuth, requirePermission, isErrorResponse, auditLog } from '@/lib/access-control';

function generateStudentId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `STU-${ts}-${rand}`;
}

// ─── GET: Get lead by ID ───────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;

    // Permission: leads.view_all or assigned
    if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN') {
      const perm = await requirePermission(req, 'leads.view_all');
      if (isErrorResponse(perm)) return perm;
    }

    const lead = await db.lead.findUnique({
      where: { id },
      include: {
        timelineEvents: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch lead.' }, { status: 500 });
  }
}

// ─── PATCH: Update lead ─────────────────────────────────────

const updateLeadSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(8).optional(),
  preferredCountry: z.string().optional().nullable(),
  preferredCourse: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.string().optional(),
  source: z.string().optional(),
  aiScore: z.number().optional(),
  leadScore: z.number().int().optional(),
  assignedTo: z.string().optional(),
  convertToStudent: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;

    // Permission check
    if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN') {
      const perm1 = await requirePermission(req, 'leads.update_all');
      if (isErrorResponse(perm1)) {
        // Fallback: check leads.update_own
        const perm2 = await requirePermission(req, 'leads.update_own');
        if (isErrorResponse(perm2)) return perm2;
      }
    }

    const existing = await db.lead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Lead not found.' }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    // Special action: convert to student
    if (parsed.data.convertToStudent) {
      if (existing.status === 'CONVERTED') {
        return NextResponse.json({ success: false, error: 'Lead is already converted.' }, { status: 400 });
      }

      const nameParts = (existing.fullName || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const student = await db.student.create({
        data: {
          studentId: generateStudentId(),
          firstName,
          lastName,
          fullName: existing.fullName,
          email: existing.email || '',
          mobile: existing.phone,
          studyDestination: existing.preferredCountry,
          studyLevel: existing.preferredCourse,
        },
      });

      const lead = await db.lead.update({
        where: { id },
        data: { status: 'CONVERTED' },
      });

      await db.timelineEvent.create({
        data: {
          leadId: id,
          type: 'CONVERTED',
          title: 'Lead converted to student',
          description: `Created student record: ${student.studentId}`,
        },
      });

      await auditLog({
        userId: auth.user.id,
        action: 'LEAD_CONVERT',
        resource: 'Lead',
        resourceId: id,
        details: { studentId: student.id, leadId: existing.leadId },
      });

      return NextResponse.json({ success: true, data: { lead, student } });
    }

    // Normal update
    const updateData: Record<string, unknown> = {};
    if (parsed.data.fullName !== undefined) updateData.fullName = parsed.data.fullName;
    if (parsed.data.email !== undefined) updateData.email = parsed.data.email;
    if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone;
    if (parsed.data.preferredCountry !== undefined) updateData.preferredCountry = parsed.data.preferredCountry;
    if (parsed.data.preferredCourse !== undefined) updateData.preferredCourse = parsed.data.preferredCourse;
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    if (parsed.data.source !== undefined) updateData.source = parsed.data.source;
    if (parsed.data.aiScore !== undefined) updateData.aiScore = parsed.data.aiScore;
    if (parsed.data.leadScore !== undefined) updateData.leadScore = parsed.data.leadScore;

    const lead = await db.lead.update({
      where: { id },
      data: updateData,
    });

    await auditLog({
      userId: auth.user.id,
      action: 'LEAD_UPDATE',
      resource: 'Lead',
      resourceId: id,
      details: parsed.data,
    });

    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ success: false, error: 'Failed to update lead.' }, { status: 500 });
  }
}

// ─── DELETE: Delete lead ────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(req, 'leads.delete');
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;

    const existing = await db.lead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Lead not found.' }, { status: 404 });
    }

    await db.timelineEvent.deleteMany({ where: { leadId: id } });
    await db.lead.delete({ where: { id } });

    await auditLog({
      userId: auth.user.id,
      action: 'LEAD_DELETE',
      resource: 'Lead',
      resourceId: id,
      details: { leadId: existing.leadId, fullName: existing.fullName },
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete lead.' }, { status: 500 });
  }
}
