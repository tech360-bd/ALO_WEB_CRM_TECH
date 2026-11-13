import { z } from 'zod';
import { phdJson, enforceRateLimit, readPhdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { generateForSop } from '@/lib/phd/services/sop';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({ overwrite: z.boolean().optional() });

// POST — builds the 10-part draft from saved facts; never overwrites existing text
// unless `overwrite: true` is sent explicitly.
export const POST = phdRoute<{ sopId: string }>(async ({ actor, req, params }) => {
  enforceRateLimit(req, actor, 'phd-sop-generate', 10, 60_000);
  const body = await readPhdJson(req, schema).catch(() => ({ overwrite: false }));
  const result = await generateForSop(actor, params.sopId, { overwrite: body.overwrite === true });
  return phdJson({ success: true, ...result });
});
