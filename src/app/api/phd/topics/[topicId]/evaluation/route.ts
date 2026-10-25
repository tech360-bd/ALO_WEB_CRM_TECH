import { phdJson, readPhdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { applyEvaluationOverrides } from '@/lib/phd/services/topics';
import { topicEvaluationSchema } from '@/lib/phd/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// PATCH /api/phd/topics/[topicId]/evaluation — applies applicant overrides with a
// written justification for each score. Criteria and weights stay visible.
export const PATCH = phdRoute<{ topicId: string }>(async ({ actor, req, params }) => {
  const input = await readPhdJson(req, topicEvaluationSchema);
  const overrides = input.overrides ?? [];
  const topic = await applyEvaluationOverrides(actor, params.topicId, overrides);
  return phdJson({ success: true, topic });
});
