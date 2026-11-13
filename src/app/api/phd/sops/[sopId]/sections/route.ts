import { phdJson, readPhdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { updateSections } from '@/lib/phd/services/sop';
import { sopSectionsSchema } from '@/lib/phd/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// PATCH — saves edited sections, creates a version and returns edited statements
// to draft so an old approval can never cover new text.
export const PATCH = phdRoute<{ sopId: string }>(async ({ actor, req, params }) => {
  const input = await readPhdJson(req, sopSectionsSchema);
  const result = await updateSections(actor, params.sopId, input.sections, input.changeSummary);
  return phdJson({ success: true, ...result });
});
