import { phdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { selectTopic } from '@/lib/phd/services/topics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/phd/topics/[topicId]/select — selects exactly one topic per project.
export const POST = phdRoute<{ topicId: string }>(async ({ actor, params }) => {
  const topic = await selectTopic(actor, params.topicId);
  return phdJson({ success: true, topic });
});
