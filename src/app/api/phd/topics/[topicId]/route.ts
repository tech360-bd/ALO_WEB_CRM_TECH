import { phdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { getTopicDetail } from '@/lib/phd/services/topics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/phd/topics/[topicId] — full candidate detail (ownership checked).
export const GET = phdRoute<{ topicId: string }>(async ({ actor, params }) => {
  const topic = await getTopicDetail(actor, params.topicId);
  return phdJson({ success: true, topic });
});
