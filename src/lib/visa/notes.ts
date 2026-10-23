import { z } from 'zod';
import { db } from '@/lib/db';
import type { AuthContext } from '@/lib/auth-middleware';
import { hasVisaPermission, isVisaSuperAdmin, visaCaseViewScope } from '@/lib/visa/access';

const noteSchema = z.object({
  caseId: z.string().trim().min(1).max(191),
  content: z.string().trim().min(1).max(5000),
  visibility: z.enum(['internal_only', 'visa_team_only', 'counselor_visible', 'application_team_visible', 'super_admin_only']).default('internal_only'),
  noteType: z.enum(['officer_note', 'case_update', 'document_review', 'interview_review']).default('officer_note'),
}).strict();

export class VisaNoteError extends Error {
  constructor(message: string, public status = 400, public details?: unknown) {
    super(message);
    this.name = 'VisaNoteError';
  }
}

function auditData(auth: AuthContext, action: string, caseId: string, studentId: string, metadata: Record<string, unknown> = {}) {
  return { actorUserId: auth.actorUserId, action, entityType: 'VisaOfficerNote', entityId: caseId, metadata: JSON.stringify({ studentId, ...metadata }), ipAddress: '', userAgent: '' };
}

export async function createVisaOfficerNote(auth: AuthContext, input: unknown) {
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) throw new VisaNoteError('A valid case ID, note, and visibility are required.', 400, parsed.error.flatten());
  const { caseId, content, visibility, noteType } = parsed.data;
  const visaCase = await db.visaCase.findUnique({ where: { id: caseId }, select: { id: true, studentId: true, visaOfficerId: true } });
  if (!visaCase) throw new VisaNoteError('Visa case not found.', 404);
  const scope = visaCaseViewScope(auth, visaCase);
  if (scope !== 'full') throw new VisaNoteError('Assigned full-case scope is required to create an officer note.', 403);
  if (visibility === 'super_admin_only' && !isVisaSuperAdmin(auth)) throw new VisaNoteError('Only SUPER_ADMIN may create a super-admin-only note.', 403);
  if (!isVisaSuperAdmin(auth)) {
    const requiredPermission = ['internal_only', 'visa_team_only'].includes(visibility) ? 'visa.notes.internal.create' : 'visa.notes.create';
    if (!hasVisaPermission(auth, requiredPermission)) throw new VisaNoteError(`${requiredPermission} permission required.`, 403);
  }

  return db.$transaction(async (tx) => {
    const note = await tx.visaOfficerNote.create({
      data: { caseId, studentId: visaCase.studentId, officerId: auth.actorUserId, officerName: auth.actorName || auth.name || 'Visa Officer', content, visibility, commentType: noteType, riskFlag: 'none' },
      select: { id: true, caseId: true, studentId: true, officerId: true, officerName: true, content: true, visibility: true, commentType: true, createdAt: true, updatedAt: true },
    });
    await tx.portalAuditLog.create({ data: auditData(auth, 'VISA_NOTE_CREATE', caseId, visaCase.studentId, { noteId: note.id, visibility, contentLength: content.length, noteType }) });
    return note;
  });
}

export async function listVisaOfficerNotes(auth: AuthContext, caseId: string) {
  if (!caseId || caseId.length > 191) throw new VisaNoteError('Valid case ID required.', 400);
  const visaCase = await db.visaCase.findUnique({ where: { id: caseId }, select: { id: true, studentId: true, visaOfficerId: true, counselorId: true, applicationOfficerId: true } });
  if (!visaCase) throw new VisaNoteError('Visa case not found.', 404);
  const scope = visaCaseViewScope(auth, visaCase);
  if (!scope) throw new VisaNoteError('Visa case is outside this account’s assigned scope.', 403);

  let visibility: string[];
  if (scope === 'summary') visibility = ['counselor_visible'];
  else if (scope === 'stage') visibility = ['application_team_visible'];
  else if (isVisaSuperAdmin(auth)) visibility = ['internal_only', 'visa_team_only', 'counselor_visible', 'application_team_visible', 'super_admin_only'];
  else {
    if (!hasVisaPermission(auth, 'visa.notes.internal.view')) throw new VisaNoteError('visa.notes.internal.view permission required.', 403);
    visibility = ['internal_only', 'visa_team_only', 'counselor_visible', 'application_team_visible'];
  }

  const notes = await db.visaOfficerNote.findMany({
    where: { caseId, studentId: visaCase.studentId, visibility: { in: visibility } },
    select: { id: true, caseId: true, studentId: true, officerId: true, officerName: true, content: true, visibility: true, commentType: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  try {
    await db.portalAuditLog.create({ data: auditData(auth, 'VISA_NOTES_VIEW', caseId, visaCase.studentId, { count: notes.length, viewScope: scope, visibility }) });
  } catch {
    throw new VisaNoteError('Notes view could not be audited.', 503);
  }
  return { notes, viewScope: scope };
}
