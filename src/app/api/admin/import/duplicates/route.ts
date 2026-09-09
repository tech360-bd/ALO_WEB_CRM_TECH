import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    const where = { duplicateRiskLevel: { in: ['high', 'medium'] } };
    if (batchId) {
       (where as any).batchId = batchId;
    }

    const stagedDuplicates = await db.importStagingStudent.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    const results: any[] = [];
    for (const staged of stagedDuplicates) {
      if (staged.email || staged.phone) {
        const matches = await db.student.findMany({
          where: {
            OR: [
              ...(staged.email ? [{ email: staged.email }] : []),
              ...(staged.phone ? [{ phone: staged.phone }] : []),
            ]
          }
        });
        
        if (matches.length > 0) {
          results.push({
            staging: staged,
            matches
          });
        }
      }
    }

    return NextResponse.json({ success: true, duplicates: results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
