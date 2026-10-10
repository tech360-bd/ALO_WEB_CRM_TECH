import { ok, failFromError } from '@/lib/ai-workforce/api';
import { listApprovals } from '@/lib/ai-workforce/approvals';
import { guard, isGuardFailure } from '../_guard';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const admission = await guard(request, 'awf.approval.read');
  if (isGuardFailure(admission)) return admission;
  const url = new URL(request.url);
  try {
    const approvals = await listApprovals({ status: url.searchParams.get('status') || undefined, take: 100 });
    return ok({ approvals }, 'Approval queue');
  } catch (error) {
    return failFromError(error, 'Unable to load approvals');
  }
}
