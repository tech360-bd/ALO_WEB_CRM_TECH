import { reportServerEvent } from '@/lib/analytics/server-conversions';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import type { AuthContext } from '@/lib/auth-middleware';
import { boundedPage, leadAccess, LEAD_STAGES, LEAD_VIEWS, leadMutationOriginAllowed, leadViewWhere } from './lead-access';

const text = (max = 191) => z.string().trim().max(max).default('');
const createInput = z.object({
  name: text(), phone: text(50), email: z.union([z.literal(''), z.email().max(191)]).default(''),
  destination: text(), level: text(), intake: text(), budget: text(),
  source: z.string().trim().min(1).max(100).default('manual'), sourceDetail: text(500),
  ieltsScore: z.number().finite().min(0).max(9).default(0),
  pteScore: z.number().finite().min(0).max(90).default(0),
  consent: z.boolean().default(false), hotLead: z.boolean().default(false),
}).strict().refine(v => Boolean(v.name || v.phone || v.email), 'Name, phone or email is required');
const patchInput = z.object({
  id: z.string().trim().min(1).max(191), expectedUpdatedAt: z.iso.datetime(),
  // Assigned/conversion must be performed by the actual assignment/conversion service.
  status: z.enum(['new', 'contacted', 'qualified', 'lost']).optional(),
  hotLead: z.boolean().optional(), followUpDone: z.boolean().optional(),
  followUpDueAt: z.iso.datetime().nullable().optional(),
}).strict().refine(v => ['status', 'hotLead', 'followUpDone', 'followUpDueAt'].some(k => k in v), 'No changes supplied');

const deny = () => NextResponse.json({ success: false, error: 'Lead access denied. A verified User ownership mapping is required for staff writes.' }, { status: 403 });
const bad = (message: string) => NextResponse.json({ success: false, error: message }, { status: 400 });
const failed = (action: string, error: unknown) => {
  console.error(`[crm.leads.${action}]`, error);
  return NextResponse.json({ success: false, error: `Failed to ${action} leads` }, { status: 500 });
};

/** Filters always intersect server-resolved ownership. No client ownership override. */
export async function listLeads(req: Request, auth: AuthContext) {
  const access = leadAccess(auth);
  if (!access) return deny();
  try {
    const params = new URL(req.url).searchParams;
    const status = params.get('status') || '';
    const tab = params.get('tab') || '';
    if ([status, tab].some(v => v && !LEAD_VIEWS.includes(v as typeof LEAD_VIEWS[number]))) return bad('Invalid lead status');
    if (params.has('createdById') || params.has('counselorId')) return bad('Ownership/assignment filters are not supported');
    const page = boundedPage(params.get('page'), 1, 100000);
    const limit = boundedPage(params.get('limit'), 20, 100);
    const search = (params.get('search') || '').trim().slice(0, 191);
    const source = (params.get('source') || '').trim().slice(0, 100);
    const hot = params.get('hotLead');
    if (hot && !['true', 'false'].includes(hot)) return bad('Invalid hotLead filter');
    const and: Prisma.MarketingLeadWhereInput[] = [access.where];
    if (search) and.push({ OR: ['name', 'phone', 'email', 'destination'].map(k => ({ [k]: { contains: search } })) });
    if (source) and.push({ source });
    if (status) and.push(leadViewWhere(status));
    if (hot) and.push({ hotLead: hot === 'true' });
    const base: Prisma.MarketingLeadWhereInput = { AND: and };
    const where: Prisma.MarketingLeadWhereInput = { AND: [base, leadViewWhere(tab)] };
    const sort = params.get('sortBy') || 'createdAt';
    const orderField = ['createdAt', 'updatedAt', 'name', 'score', 'status', 'followUpDueAt'].includes(sort) ? sort : 'createdAt';
    const views = ['all', ...LEAD_VIEWS];
    const [total, leads, viewCounts, sourceRows] = await Promise.all([
      db.marketingLead.count({ where }),
      db.marketingLead.findMany({ where, orderBy: { [orderField]: params.get('sortOrder') === 'asc' ? 'asc' : 'desc' }, skip: (page - 1) * limit, take: limit }),
      Promise.all(views.map(view => db.marketingLead.count({ where: { AND: [base, leadViewWhere(view === 'all' ? '' : view)] } }))),
      db.marketingLead.findMany({ where: access.where, distinct: ['source'], select: { source: true }, orderBy: { source: 'asc' }, take: 100 }),
    ]);
    const counts = Object.fromEntries(views.map((view, i) => [view, viewCounts[i]]));
    return NextResponse.json({ success: true, data: leads, leads, total, page, limit, totalPages: Math.ceil(total / limit), counts, summary: counts, sources: sourceRows.map(v => v.source).filter(Boolean), byStatus: Object.fromEntries(LEAD_STAGES.map(stage => [stage, leads.filter(l => l.status === stage)])), pipelineOrder: [...LEAD_STAGES], capabilities: { create: access.writable, update: access.writable, assign: false, convert: false, delete: false } });
  } catch (error) { return failed('load', error); }
}

/** Actor ID is recorded in its own namespace, not forced into a User foreign key.
 * Audit failure rolls back the mutation. No contact PII in audit metadata.
 */
async function audit(tx: Prisma.TransactionClient, auth: AuthContext, action: string, id: string, fields: string[]) {
  await tx.portalAuditLog.create({ data: {
    actorUserId: auth.actorUserId, action, entityType: 'MarketingLead', entityId: id,
    metadata: JSON.stringify({ identityDomain: auth.identityDomain, effectiveUserId: auth.userId, fields }),
  } });
}

export async function createLead(req: Request, auth: AuthContext) {
  const access = leadAccess(auth);
  if (!access?.writable || !leadMutationOriginAllowed(req, auth)) return deny();
  let body: unknown;
  try { body = await req.json(); } catch { return bad('Invalid JSON'); }
  const parsed = createInput.safeParse(body);
  if (!parsed.success) return bad('Invalid lead: supply bounded contact fields; assignment, conversion and ownership fields are not accepted');
  try {
    const lead = await db.$transaction(async tx => {
      const row = await tx.marketingLead.create({ data: { ...parsed.data, status: 'new', createdById: auth.userId } });
      await audit(tx, auth, 'LEAD_CREATE', row.id, Object.keys(parsed.data));
      return row;
    });
    return NextResponse.json({ success: true, data: lead, lead }, { status: 201 });
  } catch (error) { return failed('create', error); }
}

class LeadConflict extends Error {}
export async function updateLead(req: Request, auth: AuthContext) {
  const access = leadAccess(auth);
  if (!access?.writable || !leadMutationOriginAllowed(req, auth)) return deny();
  let body: unknown;
  try { body = await req.json(); } catch { return bad('Invalid JSON'); }
  const parsed = patchInput.safeParse(body);
  if (!parsed.success) return bad('Invalid update: id, expectedUpdatedAt and an allowed change are required. Assignment/conversion is not supported here.');
  const { id, expectedUpdatedAt, followUpDueAt, ...changes } = parsed.data;
  const data: Prisma.MarketingLeadUpdateManyMutationInput = { ...changes, updatedAt: new Date(Math.max(Date.now(), new Date(expectedUpdatedAt).getTime() + 1)), ...(followUpDueAt !== undefined ? { followUpDueAt: followUpDueAt ? new Date(followUpDueAt) : null } : {}) };
  try {
    const lead = await db.$transaction(async tx => {
      const scope: Prisma.MarketingLeadWhereInput = { AND: [access.where, { id }] };
      const result = await tx.marketingLead.updateMany({ where: { AND: [scope, { updatedAt: new Date(expectedUpdatedAt), status: { in: ['new', 'contacted', 'qualified'] } }] }, data });
      if (result.count !== 1) {
        const visible = await tx.marketingLead.findFirst({ where: scope, select: { id: true } });
        if (visible) throw new LeadConflict();
        return null;
      }
      await audit(tx, auth, 'LEAD_UPDATE', id, Object.keys(data));
      return tx.marketingLead.findFirst({ where: scope });
    });
    if (!lead) return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    // `lead_qualified` — the first business conversion in the funnel
    // (traffic -> lead -> QUALIFIED -> application -> enrolment). Emitted only
    // on the transition into a qualified status, not on every update, so
    // repeated edits to an already-qualified lead cannot inflate it.
    const nextStatus = typeof (changes as { status?: unknown }).status === 'string'
      ? String((changes as { status?: unknown }).status).toLowerCase()
      : '';
    if (nextStatus === 'qualified' || nextStatus === 'hot') {
      reportServerEvent({
        event: 'lead_qualified',
        reference: lead.id,
        params: { lead_reference: lead.id, lead_source: lead.source || undefined },
      });
    }
    return NextResponse.json({ success: true, data: lead, lead });
  } catch (error) {
    if (error instanceof LeadConflict) return NextResponse.json({ success: false, error: 'Lead changed or is terminal. Reload before updating.' }, { status: 409 });
    return failed('update', error);
  }
}
