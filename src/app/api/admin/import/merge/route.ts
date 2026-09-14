import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { validateMergeDecisions } from '@/lib/import-merge-engine';

// POST /api/admin/import/merge { stagedId, matchedStudentId, decisions: {field: KEEP_EXISTING|USE_IMPORTED|MERGE|SKIP}, batchId }
export const POST = withAuth(async (request: Request, auth: AuthContext) => {
  if (!auth.roles.includes('super_admin') && !auth.roles.includes('admin')) {
    return NextResponse.json({ success:false, error:'Forbidden — Super Admin/Admin only' }, { status:403 });
  }
  const body = await request.json().catch(()=>({}));
  const { stagedId, matchedStudentId, decisions } = body;
  if (!stagedId || !matchedStudentId || !decisions) return NextResponse.json({ success:false, error:'stagedId, matchedStudentId, decisions required' }, { status:400 });
  const staged = await db.importStagingStudent.findUnique({ where:{ id: stagedId } }).catch(()=>null) as any;
  const existing = await db.student.findUnique({ where:{ id: matchedStudentId } }).catch(()=>null) as any;
  if (!staged || !existing) return NextResponse.json({ success:false, error:'Staged or existing not found' }, { status:404 });
  // Build field comparisons for validation
  const comparisons = Object.entries(decisions).map(([field, decision]:any)=> ({ field, existingValue: existing[field], importedValue: (staged as any)[field] ?? staged.studentName, existingSource:'ALO', importedSource:'OLD_CRM', lastUpdatedExisting: String(existing.updatedAt||''), conflict: true, decision }));
  const validation = validateMergeDecisions(comparisons as any);
  if (!validation.ok) return NextResponse.json({ success:false, error: validation.errors.join('; ') }, { status:400 });
  // Mark staged as merged; actual live merge applied at execute time per field decisions
  try {
    await db.importStagingStudent.update({ where:{ id: stagedId }, data:{ status:'merged', matchedStudentId, errorDetails: JSON.stringify({ decisions, actor: auth.userId, at: new Date().toISOString() }) } as any });
    await db.crmAuditLog.create({ data:{ actorUserId: auth.userId, actorRole: auth.roles.join(','), action:'STUDENT_IMPORT_MERGE_DECIDED', targetId: matchedStudentId, batchId: staged.batchId, beforeData: JSON.stringify({ stagedId, matchedStudentId }), afterData: JSON.stringify(decisions) } as any });
    return NextResponse.json({ success:true, message:'Merge decision saved — will apply on batch execute with field-level safety' });
  } catch(e:any){ return NextResponse.json({ success:false, error:e.message }, { status:500 }); }
});
