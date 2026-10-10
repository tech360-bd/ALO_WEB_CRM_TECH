import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const isAuthorized = auth.roles.some((r) => ['SUPER_ADMIN', 'ADMIN', 'super_admin', 'admin'].includes(r));
      if (!isAuthorized) {
        return NextResponse.json({ success: false, error: 'UNAUTHORIZED: Admin authority required' }, { status: 403 });
      }

      const body = await req.json();
      const { rows, dryRun } = body;

      if (!Array.isArray(rows) || rows.length === 0 || rows.length > 500) {
        return NextResponse.json({ success: false, error: 'Provide between 1 and 500 rows' }, { status: 400 });
      }

      const validRows: any[] = [];
      const duplicateRows: any[] = [];
      const invalidRows: any[] = [];

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const name = (r.name || r.university_name || '').trim();
        const country = (r.country || r.country_code || '').trim();
        const website = (r.website || '').trim();
        const universityCode = (r.university_code || r.universityId || `UNI-${Date.now().toString(36).toUpperCase()}-${i}`).trim();

        if (!name || !country) {
          invalidRows.push({ rowIndex: i + 1, row: r, reason: 'Missing name or country' });
          continue;
        }

        const existing = await db.crmUniversity.findFirst({
          where: {
            OR: [
              { name },
              { universityId: universityCode },
              website ? { website: { contains: website.replace(/^https?:\/\//, '').split('/')[0] } } : undefined,
            ].filter(Boolean) as any,
          },
        });

        if (existing) {
          duplicateRows.push({ rowIndex: i + 1, row: r, matchedId: existing.universityId, matchedName: existing.name });
        } else {
          validRows.push({
            universityId: universityCode,
            name,
            slug: name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
            country,
            city: (r.city || '').trim(),
            campusName: (r.campus || r.campus_name || '').trim(),
            website,
            officialUrl: website,
            sourceUrl: (r.source_url || '').trim(),
            ranking: parseInt(r.ranking || '0', 10) || 0,
            worldRanking: parseInt(r.worldRanking || r.world_ranking || '0', 10) || 0,
            type: (r.type || '').trim(),
            status: 'active',
              publicationStatus: 'draft',
            verificationStatus: 'NEEDS_REVIEW',
            lastVerifiedAt: '',
          });
        }
      }

      if (dryRun) {
        return NextResponse.json({
          success: true,
          preview: {
            totalRows: rows.length,
            validCount: validRows.length,
            duplicateCount: duplicateRows.length,
            invalidCount: invalidRows.length,
            sampleValid: validRows.slice(0, 5),
            duplicates: duplicateRows,
            errors: invalidRows,
          },
        });
      }

      const importedCount = await db.$transaction(async (tx) => {
        let importedCount = 0;
        for (const uniData of validRows) {
          await tx.crmUniversity.create({ data: uniData });
          importedCount++;
        }

        await tx.crmAuditLog.create({
          data: {
            actorUserId: auth.userId || 'system',
            actorRole: auth.roles[0] || 'ADMIN',
            action: 'BATCH_IMPORT_UNIVERSITIES',
            targetCollection: 'CrmUniversity',
            targetId: `BATCH-${Date.now()}`,
            afterData: JSON.stringify({ importedCount, skippedDuplicates: duplicateRows.length }),
          },
        });

        return importedCount;
      }, { timeout: 30000 });

      return NextResponse.json({
        success: true,
        message: `Successfully imported ${importedCount} universities. Skipped ${duplicateRows.length} duplicates.`,
        importedCount,
        skippedDuplicates: duplicateRows.length,
        errors: invalidRows,
      });
    } catch {
      return NextResponse.json({ success: false, error: 'Import failed; no batch records were committed.' }, { status: 500 });
    }
  })(request);
}
