import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { checkDocumentSharingAllowed, createSecurityIncident, logDocumentAccess } from '@/lib/document-security';

export const GET = withAuth(async (req, auth) => {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (severity) where.severity = severity;
    if (status) where.status = status;

    const incidents = await db.documentSecurityIncident.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, incidents, count: incidents.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { action, documentId, studentId, recipient, recipientType } = body;

    if (action === 'check_share') {
      if (!documentId || !studentId || !recipient) {
        return NextResponse.json({ success: false, error: 'documentId, studentId, recipient required' }, { status: 400 });
      }

      const check = await checkDocumentSharingAllowed({
        documentId,
        studentId,
        requestedById: auth.userId,
        requestedByRole: auth.roles[0] || 'employee',
        recipient,
        recipientType: recipientType || 'external',
      });

      if (!check.allowed) {
        await createSecurityIncident({
          documentId,
          studentId,
          attemptedById: auth.userId,
          attemptedByName: auth.name,
          attemptedByRole: auth.roles[0],
          recipient,
          recipientType: recipientType || 'external',
          action: 'send',
          severity: check.severity || 'medium',
          reason: check.reason || 'Unauthorized recipient',
          blocked: true,
        });
      }

      return NextResponse.json({ success: true, allowed: check.allowed, reason: check.reason, severity: check.severity });
    }

    if (action === 'log_access') {
      const { accessAction, ip } = body;
      await logDocumentAccess({
        documentId,
        studentId,
        accessedById: auth.userId,
        accessedByName: auth.name,
        accessedByRole: auth.roles[0],
        action: accessAction || 'view',
        ip: ip || '',
      });
      return NextResponse.json({ success: true, message: 'Access logged' });
    }

    if (action === 'resolve_incident') {
      const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('admin') || auth.roles.includes('branch_manager');
      if (!isAuthorized) return NextResponse.json({ success: false, error: 'Manager or Admin required' }, { status: 403 });

      const { incidentId, resolution } = body;
      const updated = await db.documentSecurityIncident.update({
        where: { id: incidentId },
        data: {
          status: 'resolved',
          resolvedBy: auth.userId,
          resolvedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
