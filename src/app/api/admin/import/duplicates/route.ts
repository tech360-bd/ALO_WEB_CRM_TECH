import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

// GET /api/admin/import/duplicates?batchId=xxx — student duplicate preview for batch
// Also supports ?level=POSSIBLE_MATCH for filtering
export const GET = withAuth(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get('batchId');
  const level = searchParams.get('level');
  const where: any = {};
  if (batchId) where.batchId = batchId;
  if (level) where.duplicateRiskLevel = level;
  // only rows with risk != none
  if (!where.duplicateRiskLevel) where.duplicateRiskLevel = { not: 'none' };
  try {
    const rows = await db.importStagingStudent.findMany({ where, take: 100, orderBy:{ createdAt:'desc' } });
    // enrich with existing student if matched
    const enriched = await Promise.all(rows.map(async (r:any)=>{
      let existing=null;
      if (r.matchedStudentId) {
        try { existing = await db.student.findUnique({ where:{ id: r.matchedStudentId } }); } catch {}
      }
      return { staged: r, existing };
    }));
    return NextResponse.json({ success:true, duplicates: enriched, total: enriched.length });
  } catch (e:any) { return NextResponse.json({ success:false, error:e.message }, { status:500 }); }
});
