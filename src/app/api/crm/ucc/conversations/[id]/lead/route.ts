import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { canReadLegacyLeadDashboard } from '@/lib/crm/lead-access';
import { mutationOriginAllowed } from '@/lib/request-origin';

const identifier = z.string().trim().min(1).max(191);
const inputSchema = z.object({
  existingLeadId: identifier.optional(), createNew: z.boolean().optional(),
  leadData: z.object({
    name: z.string().trim().max(191).optional(), phone: z.string().trim().max(50).optional(),
    email: z.union([z.literal(''), z.email().max(191)]).optional(), destination: z.string().trim().max(191).optional(),
  }).strict().optional(),
}).strict().refine(v => Boolean(v.existingLeadId) !== (v.createNew === true), 'Choose an existing lead or create a new one');
const leadSelect = { id: true, name: true, phone: true, email: true, destination: true, status: true, source: true } as const;

async function authorize(request: Request, mutation = false) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  // Both conversation assignment and student links lack typed identity FKs.
  // Creator-scoping a lead cannot secure a foreign conversation. No staff,
  // Portal, matching-contact or assignee-ID fallback until mapping is verified.
  if (!canReadLegacyLeadDashboard(auth)) return NextResponse.json({ success: false, code: 'CONVERSATION_IDENTITY_MAPPING_UNVERIFIED', error: 'User administrator required for this legacy lead bridge.' }, { status: 403 });
  if (mutation && !mutationOriginAllowed(request, auth)) return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
  return auth;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorize(request);
    if (auth instanceof NextResponse) return auth;
    const parsedId = identifier.safeParse((await params).id);
    if (!parsedId.success) return NextResponse.json({ success: false, error: 'Invalid conversation ID' }, { status: 400 });
    const conversation = await db.uccConversation.findUnique({ where: { id: parsedId.data }, select: { leadId: true } });
    if (!conversation) return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
    const lead = conversation.leadId ? await db.marketingLead.findUnique({ where: { id: conversation.leadId }, select: leadSelect }) : null;
    return NextResponse.json({ success: true, leadId: lead?.id || null, lead });
  } catch {
    return NextResponse.json({ success: false, error: 'Lead information is temporarily unavailable.' }, { status: 503 });
  }
}

class BridgeError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorize(request, true);
    if (auth instanceof NextResponse) return auth;
    const parsedId = identifier.safeParse((await params).id);
    const parsed = inputSchema.safeParse(await request.json().catch(() => null));
    if (!parsedId.success || !parsed.success) return NextResponse.json({ success: false, error: 'Valid conversation ID and one explicit lead action required.' }, { status: 400 });
    const id = parsedId.data;
    const { existingLeadId, createNew, leadData = {} } = parsed.data;
    const result = await db.$transaction(async tx => {
      const conversation = await tx.uccConversation.findUnique({ where: { id } });
      if (!conversation) throw new BridgeError(404, 'Conversation not found');
      if (conversation.leadId) throw new BridgeError(409, 'Conversation already has a lead; it was not overwritten.');
      // Version claim serializes concurrent links/creates; rolls back with audit.
      const claimed = await tx.uccConversation.updateMany({
        where: { id, updatedAt: conversation.updatedAt, OR: [{ leadId: null }, { leadId: '' }] },
        data: { updatedAt: new Date(Math.max(Date.now(), conversation.updatedAt.getTime() + 1)) },
      });
      if (claimed.count !== 1) throw new BridgeError(409, 'Conversation changed; reload before linking.');
      const lead = existingLeadId
        ? await tx.marketingLead.findUnique({ where: { id: existingLeadId }, select: leadSelect })
        : await tx.marketingLead.create({ data: {
          name: leadData.name || conversation.participantName,
          phone: conversation.participantPhone || leadData.phone || '',
          email: conversation.participantEmail || leadData.email || '',
          destination: leadData.destination || conversation.destinationCountry || '',
          source: `ucc_${conversation.channel}`, status: 'new', consent: false, createdById: auth.userId,
        }, select: leadSelect });
      if (!lead) throw new BridgeError(404, 'Lead not found');
      await tx.uccConversation.update({ where: { id }, data: { leadId: lead.id } });
      await tx.portalAuditLog.create({ data: {
        actorUserId: auth.actorUserId, action: createNew ? 'LEAD_CREATED_FROM_CONVERSATION' : 'CONVERSATION_LINKED_TO_LEAD',
        entityType: 'UccConversation', entityId: id,
        metadata: JSON.stringify({ identityDomain: auth.identityDomain, effectiveUserId: auth.userId, leadId: lead.id }),
      } });
      return { lead, conversation: { id, leadId: lead.id } };
    });
    return NextResponse.json({ success: true, ...result }, { status: createNew ? 201 : 200 });
  } catch (error) {
    if (error instanceof BridgeError) return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    return NextResponse.json({ success: false, error: 'Conversation could not be linked to a lead.' }, { status: 503 });
  }
}
