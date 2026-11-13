import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { canViewVisaSensitive, hasVisaPermission, isVisaSuperAdmin, visaCaseListScope, visaCaseViewScope } from '@/lib/visa/access';

function sensitiveCategory(category: string) {
  return ['medical', 'criminal', 'sensitive'].some((word) => category.toLowerCase().includes(word));
}
function auditData(auth: AuthContext, action: string, entityId: string, studentId: string, count: number) {
  return { actorUserId: auth.actorUserId, action, entityType: 'StudentDocument', entityId, metadata: JSON.stringify({ studentId, count }), ipAddress: '', userAgent: '' };
}
function pageData<T>(items: T[], page: number, limit: number) {
  return { items: items.slice((page - 1) * limit, page * limit), total: items.length };
}
function projectDocument(document: any, canDownload: boolean) {
  return {
    id: document.id,
    studentId: document.studentId,
    caseId: document.caseId,
    category: document.category,
    fileName: document.fileName,
    fileSize: document.fileSize,
    status: document.status,
    version: document.version,
    previousVersionId: document.previousVersionId,
    reviewedAt: document.reviewedAt,
    reviewedBy: document.reviewedBy,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    downloadUrl: canDownload ? `/api/visa/documents/${encodeURIComponent(document.id)}/download` : null,
  };
}

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get('caseId');
    if (searchParams.has('studentId')) return NextResponse.json({ success: false, error: 'Use an assigned case ID; studentId is not accepted as an authorization scope.' }, { status: 400 });
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get('limit') || '50', 10) || 50));
    const categoryWhere = category ? { category } : {};
    const statusWhere = status ? { status } : {};

    if (caseId) {
      const visaCase = await db.visaCase.findUnique({ where: { id: caseId }, select: { id: true, studentId: true, visaOfficerId: true, counselorId: true, applicationOfficerId: true } });
      if (!visaCase) return NextResponse.json({ success: false, error: 'Visa case not found.' }, { status: 404 });
      const scope = visaCaseViewScope(auth, visaCase);
      if (!scope) return NextResponse.json({ success: false, error: 'Visa case is outside this account’s assigned scope.' }, { status: 403 });

      if (scope !== 'full') {
        const checklist = await db.visaChecklistItem.findMany({
          where: { caseId, studentId: visaCase.studentId, archivedAt: null, ...(scope === 'summary' ? { counselorVisible: true } : {}), ...categoryWhere, ...statusWhere },
          select: { id: true, item: true, documentName: true, category: true, isRequired: true, status: true, priority: true, deadline: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' },
        });
        const result = pageData(checklist, page, limit);
        try { await db.portalAuditLog.create({ data: auditData(auth, scope === 'summary' ? 'VISA_DOCUMENT_CHECKLIST_SUMMARY_VIEW' : 'VISA_DOCUMENT_STAGE_SUMMARY_VIEW', caseId, visaCase.studentId, result.total) }); }
        catch { return NextResponse.json({ success: false, error: 'Document summary view could not be audited.' }, { status: 503 }); }
        return NextResponse.json({ success: true, data: result.items, documents: result.items, total: result.total, pagination: { page, limit, total: result.total, pages: Math.ceil(result.total / limit) }, viewScope: scope }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
      }
      if (!isVisaSuperAdmin(auth) && !hasVisaPermission(auth, 'visa.documents.view')) return NextResponse.json({ success: false, error: 'visa.documents.view permission required.' }, { status: 403 });

      const allDocuments = await db.studentDocument.findMany({
        where: { studentId: visaCase.studentId, isArchived: false, OR: [{ caseId }, { caseId: '' }], ...categoryWhere, ...statusWhere },
        select: { id: true, studentId: true, caseId: true, category: true, fileName: true, fileSize: true, status: true, version: true, previousVersionId: true, reviewedAt: true, reviewedBy: true, createdAt: true, updatedAt: true },
        orderBy: [{ updatedAt: 'desc' }, { version: 'desc' }],
      });
      const canViewSensitive = canViewVisaSensitive(auth, visaCase);
      const visible = allDocuments.filter((document) => canViewSensitive || !sensitiveCategory(document.category));
      const result = pageData(visible, page, limit);
      const projected = result.items.map((document) => projectDocument(document, isVisaSuperAdmin(auth) || hasVisaPermission(auth, 'visa.documents.download')));
      try { await db.portalAuditLog.create({ data: auditData(auth, 'VISA_DOCUMENTS_VIEW', caseId, visaCase.studentId, result.total) }); }
      catch { return NextResponse.json({ success: false, error: 'Document list view could not be audited.' }, { status: 503 }); }
      return NextResponse.json({ success: true, data: projected, documents: projected, total: result.total, pagination: { page, limit, total: result.total, pages: Math.ceil(result.total / limit) }, viewScope: scope }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
    }

    const scope = visaCaseListScope(auth);
    if (!scope) return NextResponse.json({ success: false, error: 'Assigned visa case scope required.' }, { status: 403 });
    const cases = await db.visaCase.findMany({ where: scope.where, select: { id: true, studentId: true, visaOfficerId: true, counselorId: true, applicationOfficerId: true } });
    const caseIds = cases.map((item) => item.id);
    const studentIds = [...new Set(cases.map((item) => item.studentId))];
    if (!caseIds.length) return NextResponse.json({ success: true, data: [], documents: [], total: 0, pagination: { page, limit, total: 0, pages: 0 }, emptyState: 'No documents in the assigned case scope.' });

    if (scope.viewScope !== 'full') {
      const checklist = await db.visaChecklistItem.findMany({
        where: { caseId: { in: caseIds }, studentId: { in: studentIds }, archivedAt: null, ...(scope.viewScope === 'summary' ? { counselorVisible: true } : {}), ...categoryWhere, ...statusWhere },
        select: { id: true, caseId: true, item: true, documentName: true, category: true, isRequired: true, status: true, priority: true, deadline: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      });
      const result = pageData(checklist, page, limit);
      try { await db.portalAuditLog.create({ data: auditData(auth, 'VISA_DOCUMENT_CHECKLIST_SUMMARY_LIST', 'assigned-cases', '', result.total) }); }
      catch { return NextResponse.json({ success: false, error: 'Document summary view could not be audited.' }, { status: 503 }); }
      return NextResponse.json({ success: true, data: result.items, documents: result.items, total: result.total, pagination: { page, limit, total: result.total, pages: Math.ceil(result.total / limit) }, viewScope: scope.viewScope }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
    }
    if (!isVisaSuperAdmin(auth) && !hasVisaPermission(auth, 'visa.documents.view')) return NextResponse.json({ success: false, error: 'visa.documents.view permission required.' }, { status: 403 });

    const allDocuments = await db.studentDocument.findMany({
      where: { studentId: { in: studentIds }, caseId: { in: [...caseIds, ''] }, isArchived: false, ...categoryWhere, ...statusWhere },
      select: { id: true, studentId: true, caseId: true, category: true, fileName: true, fileSize: true, status: true, version: true, previousVersionId: true, reviewedAt: true, reviewedBy: true, createdAt: true, updatedAt: true },
      orderBy: [{ updatedAt: 'desc' }, { version: 'desc' }],
    });
    const visible = allDocuments.filter((document) => !sensitiveCategory(document.category) || cases.some((visaCase) => visaCase.studentId === document.studentId && canViewVisaSensitive(auth, visaCase)));
    const result = pageData(visible, page, limit);
    const projected = result.items.map((document) => projectDocument(document, isVisaSuperAdmin(auth) || hasVisaPermission(auth, 'visa.documents.download')));
    try { await db.portalAuditLog.create({ data: auditData(auth, 'VISA_DOCUMENTS_LIST', 'assigned-cases', '', result.total) }); }
    catch { return NextResponse.json({ success: false, error: 'Document list view could not be audited.' }, { status: 503 }); }
    return NextResponse.json({ success: true, data: projected, documents: projected, total: result.total, pagination: { page, limit, total: result.total, pages: Math.ceil(result.total / limit) }, viewScope: scope.viewScope }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Visa document list could not be audited or loaded.' }, { status: 503 });
  }
});
