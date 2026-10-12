// One authorization, validation and audit contract for both entry points.
// Legacy callers receive leads/byStatus-compatible summaries from the same
// paginated dataset; arbitrary assignment, scoring and fake conversion removed.
import { withAuth } from '@/lib/auth-middleware';
import { createLead, listLeads, updateLead } from '@/lib/crm/lead-handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = withAuth(listLeads);
export const POST = withAuth(createLead);
export const PATCH = withAuth(updateLead);
