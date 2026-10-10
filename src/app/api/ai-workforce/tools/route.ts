import { db } from '@/lib/db';
import { ok, failFromError } from '@/lib/ai-workforce/api';
import { guard, isGuardFailure } from '../_guard';

export const dynamic = 'force-dynamic';

/** Tool registry with schemas, permissions, risk and audit policy. */
export async function GET(request: Request) {
  const admission = await guard(request, 'awf.tool.read');
  if (isGuardFailure(admission)) return admission;
  try {
    const tools = await db.awfTool.findMany({
      orderBy: [{ riskLevel: 'asc' }, { slug: 'asc' }],
      select: {
        slug: true, name: true, description: true, category: true, permission: true, riskLevel: true,
        requiresApproval: true, timeoutMs: true, rateLimitPerMin: true, auditPolicy: true, securityClass: true,
        mutates: true, status: true, inputSchema: true, outputSchema: true,
        _count: { select: { grants: true, calls: true } },
      },
    });
    return ok({ tools, total: tools.length }, 'Tool registry');
  } catch (error) {
    return failFromError(error, 'Unable to load the tool registry');
  }
}
