import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { normalizeStudentRow } from '@/lib/import-normalizers';
import { evaluateIncomingVsCandidates, scoreStudentDuplicate } from '@/lib/student-duplicate-engine';

export const POST = withAuth(async (request: Request, auth: AuthContext) => {
  try {
    const data = await request.json();
    const { sourceCrmName = 'Old CRM', fileName = 'import.json', students = [] } = data;

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ success: false, error: 'No students provided for import' }, { status: 400 });
    }

    let newCount = 0;
    let matchedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    const totalRows = students.length;

    const batch = await db.importBatch.create({
      data: {
        sourceCrmName,
        fileName,
        totalRows,
        newCount: 0,
        matchedCount: 0,
        duplicateCount: 0,
        errorCount: 0,
        status: 'ready_for_review',
        createdBy: auth.userId,
      },
    });

    for (const row of students) {
      try {
        const n = normalizeStudentRow({
          oldCrmId: String(row.oldCrmId || row.id || ''),
          studentName: String(row.studentName || row.name || ''),
          phone: String(row.phone || ''),
          whatsapp: String(row.whatsapp || ''),
          email: String(row.email || ''),
          passportNumber: String(row.passportNumber || row.passport || ''),
          dateOfBirth: String(row.dateOfBirth || row.dob || ''),
          countryInterest: String(row.countryInterest || row.country || ''),
          courseInterest: String(row.courseInterest || row.course || ''),
          universityInterest: String(row.universityInterest || row.university || ''),
        });
        const studentIdVal = String(row.studentId || '');
        let matchedId = '';
        let level: string = 'NO_MATCH';
        let confidence = 0;
        let reasons: string[] = [];
        const candidates: any[] = [];
        if (n.email || n.phone || studentIdVal || n.passportNumber) {
          const found = await db.student.findFirst({
            where: {
              OR: [
                ...(n.email ? [{ email: n.email }] as any : []),
                ...(n.phone ? [{ phone: n.phone }] as any : []),
                ...(studentIdVal ? [{ studentId: studentIdVal }] as any : []),
              ],
            },
          }).catch(()=> null) as any;
          if (found) candidates.push({
            id: found.id, oldCrmId: (found as any).oldCrmId || '',
            phone: (found as any).phone || '', whatsapp: (found as any).whatsapp || '',
            email: (found as any).email || '', passportNumber: (found as any).passportNumber || '',
            normalizedNameKey: (found as any).normalizedNameKey || ((found as any).name||'').toLowerCase().replace(/[^a-z0-9]/g,''),
            studentName: (found as any).name || '', dateOfBirth: (found as any).dateOfBirth || ''
          });
        }
        if (n.passportNumber && candidates.length===0) {
           try { const byPassport = await (db as any).studentPassport?.findFirst?.({ where:{ passportNumber: n.passportNumber } }).catch(()=>null); if (byPassport?.studentId) { const s = await db.student.findUnique({where:{id: byPassport.studentId}}).catch(()=>null) as any; if(s) candidates.push({ id:s.id, passportNumber:n.passportNumber, normalizedNameKey: n.normalizedNameKey, studentName: n.studentName, dateOfBirth: n.dateOfBirth }); } } catch {}
        }
        let duplicateRisk: string = 'none';
        let status: string = 'staging';
        if (candidates.length) {
          const evalRes = evaluateIncomingVsCandidates({
            oldCrmId: n.oldCrmId, phone:n.phone, whatsapp:n.whatsapp, email:n.email, passportNumber:n.passportNumber,
            normalizedNameKey: n.normalizedNameKey, studentName: n.studentName, dateOfBirth: n.dateOfBirth
          }, candidates);
          level=evalRes.level; confidence=evalRes.confidence; reasons=evalRes.reasons; matchedId=evalRes.matchedStudentId||'';
          if (level==='MATCHED') { duplicateRisk='high'; matchedCount++; duplicateCount++; status='possible_duplicate'; }
          else if (level==='POSSIBLE_MATCH') { duplicateRisk='medium'; matchedCount++; duplicateCount++; status='possible_duplicate'; }
          else if (level==='DUPLICATE_RISK') { duplicateRisk='low'; duplicateCount++; status='possible_duplicate'; }
          else { newCount++; status='new'; }
        } else {
          newCount++; status='new';
        }

        await db.importStagingStudent.create({
          data: {
            batchId: batch.id,
            studentName: n.studentName,
            email: n.email,
            phone: n.phone,
            whatsapp: n.whatsapp,
            passportNumber: n.passportNumber,
            dateOfBirth: n.dateOfBirth,
            countryInterest: n.countryInterest,
            courseInterest: n.courseInterest,
            universityInterest: n.universityInterest,
            applicationStatus: 'new',
            counselorName: String(row.counselorName || ''),
            oldCrmId: n.oldCrmId,
            matchedStudentId: matchedId,
            duplicateRiskLevel: duplicateRisk,
            status,
            errorDetails: reasons.length? JSON.stringify({ level, confidence, reasons }) : '',
          } as any,
        });
      } catch (err:any) {
        errorCount++;
        try { await db.importError.create({ data:{ batchId: batch.id, rowNumber: -1, fieldName:'row', errorMessage: String(err?.message||err).slice(0,500), rawData: JSON.stringify(row).slice(0,2000) } as any }); } catch{}
      }
    }

    await db.importBatch.update({
      where: { id: batch.id },
      data: {
        newCount,
        matchedCount,
        duplicateCount,
        errorCount,
      }
    });

    await db.crmAuditLog.create({
      data: {
        actorUserId: auth.userId,
        actorRole: auth.roles.join(','),
        action: 'STUDENT_IMPORT_UPLOADED',
        batchId: batch.id,
        beforeData: '{}',
        afterData: JSON.stringify({ fileName, totalRows }),
      },
    });

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      totalRows,
      newCount,
      matchedCount,
      duplicateCount,
      errorCount,
      status: 'ready_for_review',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
