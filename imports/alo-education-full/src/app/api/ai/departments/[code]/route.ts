/**
 * GET /api/ai/departments/[code]
 * Get a single AI department by code with paginated agents and metrics.
 *
 * Query params: page, pageSize (for agents pagination)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type RouteContext = { params: Promise<{ code: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { code } = await context.params;

    const department = await db.aiDepartment.findUnique({
      where: { code },
      include: {
        metrics: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    });

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Paginated agents for this department
    const page = Math.max(1, Number(_request.nextUrl.searchParams.get('page')) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(_request.nextUrl.searchParams.get('pageSize')) || 20));

    const [agents, agentCount] = await Promise.all([
      db.aiAgent.findMany({
        where: { departmentId: department.id },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          code: true,
          role: true,
          status: true,
          model: true,
          description: true,
          approvalPolicy: true,
          taskSuccessCount: true,
          taskFailCount: true,
          totalTokensUsed: true,
          lastActiveAt: true,
          createdAt: true,
        },
      }),
      db.aiAgent.count({ where: { departmentId: department.id } }),
    ]);

    return NextResponse.json({
      department,
      agents,
      agentTotal: agentCount,
      page,
      pageSize,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
