import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { generateStudentCode } from '@/lib/student-auth';

function isSuperAdmin(auth: AuthContext): boolean {
  return auth.roles.some((role) => role.toLowerCase() === 'super_admin');
}

function parseList(value: string | null | undefined): unknown[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseMergeDecisions(staged: any): Record<string, string> | null {
  try {
    const parsed = JSON.parse(staged.errorDetails || '{}');
    return parsed && typeof parsed.decisions === 'object' && !Array.isArray(parsed.decisions) ? parsed.decisions : null;
  } catch {
    return null;
  }
}

function safeApplicationStage(value: string): { stage: string; safeStatus: string } {
  const key = value.trim().toUpperCase().replace(/[\s-]+/g, '_');
  const known: Record<string, { stage: string; safeStatus: string }> = {
    SUBMITTED: { stage: 'SUBMITTED', safeStatus: 'SUBMITTED' },
    UNDER_REVIEW: { stage: 'PROFILE_REVIEW', safeStatus: 'UNDER_REVIEW' },
    OFFER_RECEIVED: { stage: 'OFFER_RECEIVED', safeStatus: 'OFFER_RECEIVED' },
    REJECTED: { stage: 'REJECTED', safeStatus: 'REJECTED' },
    VISA_PREPARATION: { stage: 'VISA_PREPARATION', safeStatus: 'VISA_PREPARATION' },
    ENROLLED: { stage: 'ENROLLED', safeStatus: 'VISA_PREPARATION' },
  };
  return known[key] || { stage: 'APPLICATION_DRAFT', safeStatus: 'DRAFT' };
}

async function hasCurrentIdentityMatch(staged: any): Promise<string> {
  const clauses: any[] = [];
  if (staged.email) clauses.push({ email: staged.email });
  if (staged.phone) clauses.push({ phone: staged.phone });
  if (clauses.length) {
    const student = await db.student.findFirst({ where: { OR: clauses }, select: { id: true } });
    if (student) return student.id;
  }
  if (staged.passportNumber) {
    const passport = await db.studentPassport.findFirst({ where: { passportNumber: staged.passportNumber }, select: { studentId: true } });
    if (passport?.studentId) return passport.studentId;
  }
  if (staged.oldCrmId) {
    const events = await db.studentEvent.findMany({
      where: { eventType: 'STUDENT_IMPORTED_FROM_OLD_CRM', payload: { contains: staged.oldCrmId.slice(0, 100) } },
      select: { studentId: true, payload: true }, take: 100,
    });
    for (const event of events) {
      try { if (JSON.parse(event.payload || '{}').oldCrmId === staged.oldCrmId) return event.studentId; } catch { /* ignore malformed historical events */ }
    }
  }
  return '';
}

async function appendImportedHistory(tx: any, staged: any, studentId: string, actorId: string, sourceCrmName: string) {
  const documents = parseList(staged.documentsJson);
  const notes = parseList(staged.notesJson);
  const communications = parseList(staged.communicationJson);

  await tx.studentEvent.create({
    data: {
      studentId,
      eventType: 'STUDENT_IMPORTED_FROM_OLD_CRM',
      payload: JSON.stringify({
        batchId: staged.batchId,
        oldCrmId: staged.oldCrmId,
        sourceCrmName,
        actorId,
        createdDate: staged.createdDate,
        updatedDate: staged.updatedDate,
        applicationStatus: staged.applicationStatus,
        paymentStatus: staged.paymentStatus,
        visaStatus: staged.visaStatus,
      }),
    },
  });

  for (const note of notes) {
    const text = typeof note === 'string' ? note : JSON.stringify(note);
    if (!text.trim()) continue;
    await tx.studentEvent.create({ data: { studentId, eventType: 'LEGACY_NOTE_IMPORTED', payload: JSON.stringify({ sourceCrmName, oldCrmId: staged.oldCrmId, note, importedBy: actorId }) } });
  }
  for (const message of communications) {
    const text = typeof message === 'string' ? message : String((message as any)?.message || (message as any)?.text || JSON.stringify(message));
    if (!text.trim()) continue;
    const messageDate = typeof message === 'object' && message && 'createdAt' in message ? new Date(String((message as any).createdAt)) : null;
    const validDate = messageDate && Number.isFinite(messageDate.getTime()) ? messageDate : undefined;
    await tx.studentMessage.create({
      data: { studentId, senderType: 'employee', senderName: sourceCrmName, message: text.slice(0, 20_000), channel: 'old_crm', ...(validDate ? { createdAt: validDate } : {}) },
    });
    await tx.studentEvent.create({ data: { studentId, eventType: 'LEGACY_COMMUNICATION_IMPORTED', payload: JSON.stringify({ sourceCrmName, oldCrmId: staged.oldCrmId, message, importedBy: actorId }) } });
  }
  for (const document of documents) {
    const item = typeof document === 'string' ? { name: document, category: 'other' } : document as Record<string, unknown>;
    const fileName = String(item.fileName || item.name || item.title || '').trim().slice(0, 191);
    if (!fileName) continue;
    await tx.studentDocument.create({
      data: {
        studentId,
        category: String(item.category || item.type || 'other').slice(0, 100),
        fileName,
        status: 'legacy_reference_needs_review',
        reviewerNote: `Legacy reference from ${sourceCrmName}; file bytes were not included in the import. Re-upload through secure document upload before use.`,
      },
    });
    await tx.studentEvent.create({ data: { studentId, eventType: 'LEGACY_DOCUMENT_REFERENCE_IMPORTED', payload: JSON.stringify({ sourceCrmName, oldCrmId: staged.oldCrmId, fileName, category: item.category || item.type || 'other', importedBy: actorId }) } });
  }

  const hasApplicationData = Boolean(staged.universityInterest || staged.courseInterest)
    && Boolean(staged.applicationStatus && !['new', 'lead', 'lead_created'].includes(staged.applicationStatus.toLowerCase()));
  if (hasApplicationData) {
    const applicationStage = safeApplicationStage(staged.applicationStatus);
    const paymentKey = String(staged.paymentStatus || '').toUpperCase();
    await tx.application.create({
      data: {
        studentId,
        universityName: staged.universityInterest,
        courseName: staged.courseInterest,
        country: staged.countryInterest,
        applicationSource: 'MANUAL_IMPORT',
        stage: applicationStage.stage,
        safeStatus: applicationStage.safeStatus,
        paymentStatus: ['PAID', 'PARTIAL', 'OVERDUE'].includes(paymentKey) ? paymentKey : 'PENDING',
        notes: `Imported from ${sourceCrmName}; source CRM status: ${staged.applicationStatus}. Old CRM ID: ${staged.oldCrmId || 'not supplied'}.`,
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }

  if (staged.paymentStatus !== 'none' || staged.visaStatus !== 'none') {
    await tx.studentEvent.create({
      data: { studentId, eventType: 'LEGACY_PAYMENT_VISA_STATUS_IMPORTED', payload: JSON.stringify({ sourceCrmName, paymentStatus: staged.paymentStatus, visaStatus: staged.visaStatus, importedBy: actorId }) },
    });
  }
}

export const POST = withAuth(async (request: Request, auth: AuthContext) => {
  if (!isSuperAdmin(auth)) return NextResponse.json({ success: false, error: 'Super Admin access required.' }, { status: 403 });

  const id = new URL(request.url).pathname.split('/').slice(-2, -1)[0];
  if (!id) return NextResponse.json({ success: false, error: 'Batch ID is required.' }, { status: 400 });

  try {
    // Compare-and-set prevents repeat execution, including simultaneous requests.
    const claimed = await db.importBatch.updateMany({ where: { id, status: 'approved' }, data: { status: 'processing' } });
    if (claimed.count !== 1) {
      const current = await db.importBatch.findUnique({ where: { id }, select: { status: true } });
      if (!current) return NextResponse.json({ success: false, error: 'Batch not found.' }, { status: 404 });
      return NextResponse.json({ success: false, error: `Batch must be approved before execution (current: ${current.status}).` }, { status: 409 });
    }

    const batch = await db.importBatch.findUnique({ where: { id }, include: { students: true } });
    if (!batch) {
      await db.importBatch.updateMany({ where: { id, status: 'processing' }, data: { status: 'approved' } });
      return NextResponse.json({ success: false, error: 'Batch not found.' }, { status: 404 });
    }

    let importedCount = 0;
    let mergedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const staged of batch.students) {
      if (!['new', 'staging', 'ready', 'merged'].includes(staged.status)) { skippedCount += 1; continue; }
      try {
        if (staged.status === 'merged') {
          const decisions = parseMergeDecisions(staged);
          if (!decisions || !staged.matchedStudentId) throw new Error('Explicit Super Admin merge decisions are missing.');
          const allowedFields: Record<string, { target: string; value: unknown }> = {
            studentName: { target: 'name', value: staged.studentName },
            email: { target: 'email', value: staged.email },
            phone: { target: 'phone', value: staged.phone },
            countryInterest: { target: 'currentCountry', value: staged.countryInterest },
          };
          const update: Record<string, unknown> = {};
          for (const [field, decision] of Object.entries(decisions)) {
            if (!['KEEP_EXISTING', 'USE_IMPORTED', 'SKIP'].includes(String(decision))) throw new Error(`Invalid merge decision for ${field}.`);
            const mapping = allowedFields[field];
            if (!mapping) continue;
            if (decision === 'USE_IMPORTED' && mapping.value != null && mapping.value !== '') update[mapping.target] = mapping.value;
          }
          await db.$transaction(async (tx) => {
            const existing = await tx.student.findUnique({ where: { id: staged.matchedStudentId }, select: { id: true } });
            if (!existing) throw new Error('The matched student no longer exists; merge was not applied.');
            if (Object.keys(update).length) await tx.student.update({ where: { id: existing.id }, data: update });
            await appendImportedHistory(tx, staged, existing.id, auth.userId, batch.sourceCrmName);
            await tx.importStagingStudent.update({ where: { id: staged.id }, data: { status: 'imported', matchedStudentId: existing.id } });
          });
          mergedCount += 1;
          continue;
        }

        if (!staged.studentName || (!staged.phone && !staged.whatsapp && !staged.email && !staged.passportNumber && !staged.oldCrmId)) {
          await db.importStagingStudent.update({ where: { id: staged.id }, data: { status: 'needs_information' } });
          skippedCount += 1;
          continue;
        }
        const existingStudentId = await hasCurrentIdentityMatch(staged);
        if (existingStudentId) {
          await db.importStagingStudent.update({
            where: { id: staged.id },
            data: { status: 'possible_duplicate', matchedStudentId: existingStudentId, duplicateRiskLevel: 'high', errorDetails: 'A matching student appeared after staging. Review and merge explicitly.' },
          });
          skippedCount += 1;
          continue;
        }

        const studentCode = await generateStudentCode();
        await db.$transaction(async (tx) => {
          const student = await tx.student.create({
            data: {
              studentId: studentCode,
              name: staged.studentName,
              email: staged.email,
              phone: staged.phone || staged.whatsapp,
              currentCountry: staged.countryInterest,
              journeyStage: 'lead_created',
              status: 'active',
              counselorName: staged.counselorName,
            },
          });
          if (staged.passportNumber) {
            await tx.studentPassport.create({ data: { studentId: student.id, passportNumber: staged.passportNumber, fullName: staged.studentName, dateOfBirth: staged.dateOfBirth } });
          }
          await appendImportedHistory(tx, staged, student.id, auth.userId, batch.sourceCrmName);
          const counselor = staged.counselorName
            ? await tx.employee.findFirst({ where: { name: { contains: staged.counselorName } }, select: { id: true, userId: true } })
            : null;
          await tx.counselorTask.create({
            data: {
              employeeId: counselor?.userId || auth.userId,
              studentId: student.id,
              title: `Review imported student: ${staged.studentName}`,
              description: `Verify legacy CRM data, documents and contact details. Source: ${batch.sourceCrmName}; old CRM ID: ${staged.oldCrmId || 'not supplied'}.`,
              type: 'import_review',
              priority: 'medium',
              status: 'pending',
            },
          });
          await tx.importStagingStudent.update({ where: { id: staged.id }, data: { status: 'imported', matchedStudentId: student.id } });
        });
        importedCount += 1;
      } catch (error) {
        errorCount += 1;
        await db.importStagingStudent.update({
          where: { id: staged.id },
          data: { status: 'import_error', errorDetails: String(error instanceof Error ? error.message : error).slice(0, 1000) },
        }).catch(() => undefined);
      }
    }

    const completedStatus = errorCount || skippedCount ? 'completed_with_errors' : 'completed';
    await db.importBatch.update({ where: { id }, data: { status: completedStatus } });
    await db.crmAuditLog.create({
      data: {
        actorUserId: auth.userId,
        actorRole: auth.roles.join(','),
        action: 'STUDENT_IMPORT_EXECUTED',
        batchId: id,
        afterData: JSON.stringify({ importedCount, mergedCount, skippedCount, errorCount }),
      },
    });

    return NextResponse.json({
      success: true,
      importedCount,
      mergedCount,
      skippedCount,
      errorCount,
      status: completedStatus,
      message: 'Approved import batch processed. Legacy document references remain pending secure re-upload; no portal login was created or sent.',
    });
  } catch {
    await db.importBatch.updateMany({ where: { id, status: 'processing' }, data: { status: 'approved' } }).catch(() => undefined);
    return NextResponse.json({ success: false, error: 'Approved import could not be completed; the batch remains available for safe retry.' }, { status: 503 });
  }
});
