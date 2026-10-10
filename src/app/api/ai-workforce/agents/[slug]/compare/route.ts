import { ok, failFromError } from '@/lib/ai-workforce/api';
import { compareVersions } from '@/lib/ai-workforce/lifecycle';
import { guard, isGuardFailure } from '../../../_guard';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const admission = await guard(request, 'awf.agent.read');
  if (isGuardFailure(admission)) return admission;
  const { slug } = await context.params;
  const url = new URL(request.url);
  try {
    const diff = await compareVersions(slug, Number(url.searchParams.get('from')), Number(url.searchParams.get('to')));
    return ok(diff, 'Version comparison');
  } catch (error) {
    return failFromError(error, 'Unable to compare versions', 400);
  }
}
