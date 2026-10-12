import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const isAuthorized = auth.roles.some((r) => ['SUPER_ADMIN', 'ADMIN', 'super_admin', 'admin'].includes(r));
      if (!isAuthorized) return NextResponse.json({ success: false, error: 'Admin required' }, { status: 403 });
      const body = await req.json();
      const { rows, dryRun } = body;
      if (!Array.isArray(rows) || rows.length === 0) return NextResponse.json({ success: false, error: 'Rows array required' }, { status: 400 });
      const validRows: any[] = [];
      const invalidRows: any[] = [];
      const duplicateRows: any[] = [];
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const name = (r.name || r.scholarship_name || '').trim();
        const amount = parseFloat(r.amount || '0') || 0;
        if (!name) { invalidRows.push({ rowIndex: i+1, row: r, reason: 'Missing name' }); continue; }
        const existing = await db.scholarship.findFirst({ where: { OR: [{ name: { contains: name } }, { slug: (r.slug||'').trim() }] } }).catch(()=>null);
        if (existing) { duplicateRows.push({ rowIndex: i+1, row: r, matchedName: existing.name }); }
        else {
          validRows.push({
            slug: (r.slug || name.toLowerCase().replace(/[^a-z0-9]+/g,'-')).trim(),
            name,
            country: (r.country || r.country_code || '').trim(),
            university: (r.university || '').trim(),
            universityId: (r.university_code || r.university_id || '').trim(),
            // Phase 1 review (P1-D): no invented values (previously 'Check eligibility' and a GBP default).
            fundingAmount: r.amount ? `${r.currency||''} ${r.amount}`.trim() : '',
            amount,
            currency: (r.currency || '').trim(),
            fundingType: (r.amount_type || 'tuition_waiver').trim(),
            eligibility: (r.eligibility || '').trim(),
            deadline: (r.deadline || '').trim(),
            overview: (r.description || '').trim(),
            officialSourceUrl: (r.source_url || '').trim(),
            status: 'active',
            // An import is not verification: every imported row starts pending
            // with no verification date, whether or not a source URL was given.
            verificationStatus: 'pending',
            lastVerifiedAt: null,
          });
        }
      }
      if (dryRun) return NextResponse.json({ success: true, preview: { totalRows: rows.length, validCount: validRows.length, duplicateCount: duplicateRows.length, invalidCount: invalidRows.length, sampleValid: validRows.slice(0,5), duplicates: duplicateRows, errors: invalidRows } });
      let imported = 0;
      for (const s of validRows) { await db.scholarship.create({ data: s }); imported++; }
      await db.auditLog.create({ data: { userId: auth.userId, action: 'BATCH_IMPORT_SCHOLARSHIPS', resource: 'Scholarship', resourceId: `BATCH-${Date.now()}`, details: JSON.stringify({ imported, duplicates: duplicateRows.length }) } }).catch(()=>{});
      return NextResponse.json({ success: true, imported, duplicates: duplicateRows.length, invalid: invalidRows.length });
    } catch(e:any){ return NextResponse.json({ success:false, error:e.message }, { status:500 }); }
  })(request);
}
