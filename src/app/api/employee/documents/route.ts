import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logSecurityAudit, validateRequestAccess } from '@/lib/access-control/central-security-engine';
import { authenticateRequest } from '@/lib/auth-middleware';
import crypto from 'crypto';

export async function POST(req: Request) {
  const authResult = await authenticateRequest(req);
  if (authResult instanceof NextResponse) return authResult;
  const auth: any = authResult;
  const _blockedTypes = ['STUDENT','student','PARTNER','partner'];
  if (_blockedTypes.includes(auth.userType) || (auth.roles && auth.roles.some((r:string)=> _blockedTypes.includes(r)))) {
    return NextResponse.json({ success:false, error:'Forbidden: employee access only' }, { status:403 });
  }
  // continue to original logic but ensure actor is authenticated user
  try {
    const { employeeId, documentType, filePath, fileName, uploadedBy } = await req.json();
    if (!employeeId || !documentType || !filePath) return NextResponse.json({ error: 'Missing required document parameters.' }, { status: 400 });
    let document = await db.employeeDocument.findFirst({ where: { employeeId, documentType } });
    const fileHash = crypto.createHash('md5').update(`${filePath}-${Date.now()}`).digest('hex');
    const versionData = (employeeDocumentId: string, version: number) => ({ employeeDocumentId, version, filePath, fileName: fileName || `${documentType}.pdf`, status: 'pending', uploadedBy: uploadedBy || employeeId });
    if (!document) {
      document = await db.employeeDocument.create({ data: { employeeId, documentType, filePath, fileName: fileName || `${documentType}.pdf`, status: 'pending' } });
      await db.employeeDocumentVersion.create({ data: versionData(document.id, 1) });
    } else {
      const latest = await db.employeeDocumentVersion.findFirst({ where: { employeeDocumentId: document.id }, orderBy: { version: 'desc' } });
      const nextVersion = (latest?.version || 0) + 1;
      await db.employeeDocument.update({ where: { id: document.id }, data: { filePath, fileName: fileName || `${documentType}.pdf`, status: 'pending' } });
      await db.employeeDocumentVersion.create({ data: versionData(document.id, nextVersion) });
    }
    await logSecurityAudit({ actorId: uploadedBy || employeeId, actorRole: 'Employee', action: 'EMPLOYEE_DOCUMENT_UPLOADED', targetType: 'EmployeeDocument', targetId: document.id, newValue: JSON.stringify({ documentType, fileName, fileHash }) });
    return NextResponse.json({ success: true, document });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Server error uploading document' }, { status: 500 }); }
}

export async function PATCH(req: Request) {
  const authResult2 = await authenticateRequest(req);
  if (authResult2 instanceof NextResponse) return authResult2;
  const auth2: any = authResult2;
  if (['STUDENT','student','PARTNER','partner'].includes(auth2.userType) || (auth2.roles && auth2.roles.some((r:string)=> ['STUDENT','student','PARTNER','partner'].includes(r)))) {
    return NextResponse.json({ success:false, error:'Forbidden: employee access only' }, { status:403 });
  }
  try {
    const { documentId, reviewerId, action, reviewNote } = await req.json();
    const effectiveReviewer = auth2.userId;
    if (!documentId || !action) return NextResponse.json({ error: 'Missing review parameters' }, { status: 400 });
    const access = await validateRequestAccess({ userId: effectiveReviewer }, 'documents', action);
    if (!access.allowed) return NextResponse.json({ error: access.reason || 'Unauthorized' }, { status: 403 });
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const document = await db.employeeDocument.update({ where: { id: documentId }, data: { status: newStatus, reviewerId: effectiveReviewer, reviewNote: reviewNote || '' } });
    const latest = await db.employeeDocumentVersion.findFirst({ where: { employeeDocumentId: documentId }, orderBy: { version: 'desc' } });
    if (latest) await db.employeeDocumentVersion.update({ where: { id: latest.id }, data: { status: newStatus } });
    await logSecurityAudit({ actorId: effectiveReviewer, actorRole: 'Reviewer', action: `EMPLOYEE_DOCUMENT_${newStatus.toUpperCase()}`, targetType: 'EmployeeDocument', targetId: documentId, reason: reviewNote });
    return NextResponse.json({ success: true, document });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Server error reviewing document' }, { status: 500 }); }
}
