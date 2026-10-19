import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { materialiseStudentGraph } from '@/lib/intelligence/opportunity-graph';

// ============================================================
// POST /api/intelligence/opportunity-graph/[studentId]/materialise
// Persist the derived edges for fast reuse. Staff only.
// ============================================================

type RouteContext = { params: Promise<{ studentId: string }> };

export const POST = withAuth(async (_request: Request, _auth, context: RouteContext) => {
  const { studentId } = await context.params;
  try {
    const result = await materialiseStudentGraph(studentId);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Materialisation failed' },
      { status: 404 },
    );
  }
}, { requireUserTypes: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'CEO', 'COUNSELOR'] });
