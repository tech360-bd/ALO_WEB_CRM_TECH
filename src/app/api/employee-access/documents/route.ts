import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';
import { canViewEmployeeDocument } from '@/lib/access-check-engine';

// Mandatory/optional document types per spec
const DOC_TYPES = [
  'passport','nid','photo','cv','academic_certificate','experience_letter','appointment_letter','confirmation_letter','increment_letter','promotion_letter','transfer_letter','warning_letter','termination_letter','employment_agreement','nda','confidentiality_agreement','device_agreement','it_policy','data_privacy_agreement','international_agreement','bangladesh_employment_agreement','exit_clearance','other_hr_document'
];

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId') || auth.userId;
    const status = searchParams.get('status');

    const canView = await canViewEmployeeDocument(auth.userId, auth.roles, employeeId, 'any');
    const isSelf = employeeId === auth.userId;
    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('hr_manager');

    if (!isSelf && !isSuper && !canView) {
      return NextResponse.json({ success: false, error: 'Permission denied for employee documents' }, { status: 403 });
    }

    const where: any = { employeeId };
    if (status) where.status = status;

    const docs = await db.employeeDocument.findMany({ where, orderBy: { createdAt: 'desc' } }).catch(() => []);
    const versions = await (db as any).employeeDocumentVersion.findMany({ where: { documentId: { in: docs.map((d: any) => d.id) } }, orderBy: { version: 'desc' } }).catch(() => []);

    return NextResponse.json({
      success: true,
      documents: docs,
      versions,
      docTypes: DOC_TYPES,
      restriction: 'NO PERMANENT DELETE for official HR documents — archive/soft-delete only, historical versions remain',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const body = await req.json();
    const { employeeId, documentType, filePath, fileName } = body;
    if (!documentType || !filePath) return NextResponse.json({ success: false, error: 'documentType and filePath required' }, { status: 400 });

    const targetEmployeeId = employeeId || auth.userId;
    const isSelf = targetEmployeeId === auth.userId;
    const isHr = auth.roles.includes('hr_manager') || auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');

    if (!isSelf && !isHr) {
      return NextResponse.json({ success: false, error: 'Only self or HR can upload' }, { status: 403 });
    }

    // Check if document already exists — versioning
    const existing = await db.employeeDocument.findFirst({ where: { employeeId: targetEmployeeId, documentType } }).catch(() => null);

    let doc;
    if (existing) {
      // Create new version
      const currentVersion = (existing as any).current_version || 1;
      const newVersion = currentVersion + 1;

      await (db as any).employeeDocumentVersion.create({
        data: {
          documentId: existing.id,
          version: currentVersion,
          filePath: (existing as any).filePath,
          fileName: (existing as any).fileName,
          uploadedBy: (existing as any).uploadedBy || targetEmployeeId,
          status: 'historical',
        },
      }).catch(() => {});

      doc = await db.employeeDocument.update({
        where: { id: existing.id },
        data: {
          filePath,
          fileName: fileName || documentType,
          status: 'pending',
        },
      });

      await (db as any).employeeDocumentVersion.create({
        data: {
          documentId: doc.id,
          version: newVersion,
          filePath,
          fileName: fileName || documentType,
          uploadedBy: auth.userId,
          status: 'current',
        },
      }).catch(() => {});
    } else {
      doc = await db.employeeDocument.create({
        data: {
          employeeId: targetEmployeeId,
          documentType,
          filePath,
          fileName: fileName || documentType,
          status: 'pending',
        },
      });

      await (db as any).employeeDocumentVersion.create({
        data: {
          documentId: doc.id,
          version: 1,
          filePath,
          fileName: fileName || documentType,
          uploadedBy: auth.userId,
          status: 'current',
        },
      }).catch(() => {});
    }

    await logAuditAction(auth, 'EMPLOYEE_DOCUMENT_UPLOADED', 'EmployeeDocument', doc.id, { documentType, employeeId: targetEmployeeId });

    return NextResponse.json({ success: true, data: doc, message: 'Document uploaded — versioning applied, no permanent delete' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
