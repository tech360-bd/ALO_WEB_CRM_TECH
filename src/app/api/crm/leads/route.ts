import { withAuth } from '@/lib/auth-middleware';
import { createLead, listLeads, updateLead } from '@/lib/crm/lead-handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = withAuth(listLeads);
export const POST = withAuth(createLead);
export const PATCH = withAuth(updateLead);
// Hard deletion intentionally unavailable: retention and dependent-record rules
// must be established before adding a destructive endpoint.
