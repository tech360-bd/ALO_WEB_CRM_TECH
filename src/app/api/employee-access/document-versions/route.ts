import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('documentId');
    if (!documentId) return NextResponse.json({ success: false, error: 'documentId required' }, { status: 400 });

    const versions = await (db as any).employeeDocumentVersion.findMany({
      where: { documentId },
      orderBy: { version: 'desc' },
    }).catch(() => []);

    return NextResponse.json({
      success: true,
      versions,
      note: 'Only one version can be CURRENT, previous remain historical per retention policy, no permanent delete',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
