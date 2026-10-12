import { ok, failFromError } from '@/lib/ai-workforce/api';
import { readAudit } from '@/lib/ai-workforce/audit';
import { guard, isGuardFailure } from '../_guard';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const admission = await guard(request, 'awf.audit.read');
  if (isGuardFailure(admission)) return admission;
  const url = new URL(request.url);
  try {
    const entries = await readAudit({
      action: url.searchParams.get('action') || undefined,
      objectType: url.searchParams.get('objectType') || undefined,
      objectId: url.searchParams.get('objectId') || undefined,
      take: Math.min(Number(url.searchParams.get('take') || 100), 500),
    });
    return ok({ entries }, 'Audit trail');
  } catch (error) {
    return failFromError(error, 'Unable to read the audit trail');
  }
}
