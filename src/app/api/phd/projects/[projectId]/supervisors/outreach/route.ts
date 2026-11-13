import { z } from 'zod';
import { phdJson, enforceRateLimit, readPhdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { draftOutreach, listOutreach, updateOutreach } from '@/lib/phd/services/supervisors';
import { outreachDraftSchema, outreachUpdateSchema } from '@/lib/phd/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/phd/projects/[projectId]/supervisors/outreach — outreach history.
export const GET = phdRoute<{ projectId: string }>(async ({ actor, params }) => {
  const contacts = await listOutreach(actor, params.projectId);
  return phdJson({ success: true, contacts });
});

// POST — drafts an email. Nothing is ever sent from the platform; the user must
// review and send it from their own mailbox.
export const POST = phdRoute<{ projectId: string }>(async ({ actor, req, params }) => {
  enforceRateLimit(req, actor, 'phd-outreach', 20, 60_000);
  const input = await readPhdJson(req, outreachDraftSchema);
  const draft = await draftOutreach(actor, params.projectId, input.supervisorId, input.applications);
  return phdJson({ success: true, draft }, 201);
});

// PATCH — records the outcome the user reports (sent / replied / follow-up due).
const updateSchema = outreachUpdateSchema.extend({ contactId: z.string().min(1).max(64) });
export const PATCH = phdRoute<{ projectId: string }>(async ({ actor, req, params }) => {
  const input = await readPhdJson(req, updateSchema);
  const contact = await updateOutreach(actor, params.projectId, input.contactId, {
    status: input.status,
    notes: input.notes ?? null,
    responseSummary: input.responseSummary ?? null,
    nextFollowUpAt: input.nextFollowUpAt ? String(input.nextFollowUpAt) : null,
  });
  return phdJson({ success: true, contact });
});
