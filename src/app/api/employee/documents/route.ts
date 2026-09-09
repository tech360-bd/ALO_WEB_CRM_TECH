import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logSecurityAudit, validateRequestAccess } from '@/lib/access-control/central-security-engine';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { employeeId, documentType, filePath, fileName, uploadedBy } = await req.json();

    if (!employeeId || !documentType || !filePath) {
      return NextResponse.json({ error: 'Missing required document parameters.' }, { status: 400 });
    }

    // 1. Check existing document for versioning
    let doc = await db.employeeDocument.findFirst({
      where: { employeeId, documentType },
    });

    const fileHash = crypto.createHash('md5').update(`${filePath}-${Date.now()}`).digest('hex');

    if (!doc) {
      // Create new document record
      doc = await db.employeeDocument.create({
        data: {
          employeeId,
          documentType,
          filePath,
          fileName: fileName || `${documentType}.pdf`,
          status: 'pending',
        },
      });

      // Create Version 1
      await db.employeeDocumentVersion.create({
        data: {
          documentId: doc.id,
          versionNumber: 1,
          filePath,
          fileName: fileName || `${documentType}.pdf`,
          fileHash,
          status: 'pending',
          uploadedBy: uploadedBy || employeeId,
          effectiveDate: new Date().toISOString().split('T')[0],
        },
      });
    } else {
      // Find latest version number
      const versions = await db.employeeDocumentVersion.findMany({
        where: { documentId: doc.id },
        orderBy: { versionNumber: 'desc' },
      });

      const nextVersion = versions.length > 0 ? versions[0].versionNumber + 1 : 2;

      // Update current document to point to new version
      await db.employeeDocument.update({
        where: { id: doc.id },
        data: {
          filePath,
          fileName: fileName || `${documentType}.pdf`,
          status: 'pending',
        },
      });

      // Create Version N
      await db.employeeDocumentVersion.create({
        data: {
          documentId: doc.id,
          versionNumber: nextVersion,
          filePath,
          fileName: fileName || `${documentType}.pdf`,
          fileHash,
          status: 'pending',
          uploadedBy: uploadedBy || employeeId,
          effectiveDate: new Date().toISOString().split('T')[0],
        },
      });
    }

    await logSecurityAudit({
      actorId: uploadedBy || employeeId,
      actorRole: 'Employee',
      action: 'EMPLOYEE_DOCUMENT_UPLOADED',
      targetType: 'EmployeeDocument',
      targetId: doc.id,
      newValue: JSON.stringify({ documentType, fileName }),
    });

    return NextResponse.json({ success: true, document: doc });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error uploading document' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { documentId, reviewerId, action, reviewNote } = await req.json(); // action: 'approve' | 'reject'

    if (!documentId || !reviewerId || !action) {
      return NextResponse.json({ error: 'Missing review parameters' }, { status: 400 });
    }

    const access = await validateRequestAccess({ userId: reviewerId }, 'documents', action);
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason || 'Unauthorized' }, { status: 403 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const doc = await db.employeeDocument.update({
      where: { id: documentId },
      data: {
        status: newStatus,
        reviewerId,
        reviewNote: reviewNote || '',
      },
    });

    // Update version status
    const latestVersion = await db.employeeDocumentVersion.findFirst({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
    });

    if (latestVersion) {
      await db.employeeDocumentVersion.update({
        where: { id: latestVersion.id },
        data: {
          status: newStatus,
          reviewerId,
          reviewNote: reviewNote || '',
        },
      });
    }

    await logSecurityAudit({
      actorId: reviewerId,
      actorRole: 'Reviewer',
      action: `EMPLOYEE_DOCUMENT_${newStatus.toUpperCase()}`,
      targetType: 'EmployeeDocument',
      targetId: documentId,
      reason: reviewNote,
    });

    return NextResponse.json({ success: true, document: doc });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error reviewing document' }, { status: 500 });
  }
}
