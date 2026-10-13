import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';

/**
 * STOP / BLOCK / opt-out endpoint — PUBLIC (called from SMS/WhatsApp reply webhooks).
 * Body: { phone?, email?, channel }
 * - Sets optedOutAt + status 'opted_out' on matching LeadOutreach rows.
 * - Sets CommunicationPreference.marketingAllowed = false (and optOutAt) for any owner
 *   that maps to the phone/email (Lead, Student, Partner).
 * - Audits `lead_outreach.opt_out_recorded`.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, email, channel } = body;

    if (!phone && !email) {
      return NextResponse.json(
        { error: 'phone or email is required' },
        { status: 400 }
      );
    }
    if (channel && !['whatsapp', 'sms', 'email', 'call'].includes(channel)) {
      return NextResponse.json(
        { error: "channel must be one of: whatsapp, sms, email, call" },
        { status: 400 }
      );
    }

    const now = new Date();
    const where: { OR: Array<Record<string, string>> } = { OR: [] };
    if (phone) where.OR.push({ phone });
    if (email) where.OR.push({ email });

    // 1. Mark LeadOutreach rows as opted_out
    const outreachRows = await db.leadOutreach.findMany({ where });
    let updatedOutreach = 0;
    if (outreachRows.length > 0) {
      const res = await db.leadOutreach.updateMany({
        where,
        data: {
          consentStatus: 'opted_out',
          optedOutAt: now,
          status: 'opted_out',
        },
      });
      updatedOutreach = res.count;
    }

    // 2. Find Lead / Student / Partner owners by phone/email and update their preferences
    const owners: Array<{ ownerType: string; ownerId: string }> = [];

    // Leads
    const leadWhere: { OR?: Array<Record<string, string>> } = {};
    const leadClauses: Array<Record<string, string>> = [];
    if (phone) leadClauses.push({ phone }, { whatsappNumber: phone });
    if (email) leadClauses.push({ email });
    if (leadClauses.length > 0) {
      leadWhere.OR = leadClauses;
      const leads = await db.lead.findMany({ where: leadWhere, select: { id: true } });
      for (const l of leads) owners.push({ ownerType: 'LEAD', ownerId: l.id });
    }

    // Students (schema: phone + email + whatsappNumber — check below)
    const studentClauses: Array<Record<string, string>> = [];
    if (phone) studentClauses.push({ phone }, { whatsappNumber: phone });
    if (email) studentClauses.push({ email });
    if (studentClauses.length > 0) {
      const students = await db.student.findMany({
        where: { OR: studentClauses },
        select: { id: true },
      });
      for (const s of students) owners.push({ ownerType: 'STUDENT', ownerId: s.id });
    }

    // Partners
    const partnerClauses: Array<Record<string, string>> = [];
    if (phone) partnerClauses.push({ phone });
    if (email) partnerClauses.push({ email });
    if (partnerClauses.length > 0) {
      const partners = await db.partner.findMany({
        where: { OR: partnerClauses },
        select: { id: true },
      });
      for (const p of partners) owners.push({ ownerType: 'PARTNER', ownerId: p.id });
    }

    // Upsert preferences: marketingAllowed=false + optOutAt
    let updatedPrefs = 0;
    for (const owner of owners) {
      const existing = await db.communicationPreference.findUnique({
        where: { ownerType_ownerId: owner },
      });
      if (existing) {
        await db.communicationPreference.update({
          where: { id: existing.id },
          data: { marketingAllowed: false, optOutAt: now, consentSource: channel || 'whatsapp_reply' },
        });
      } else {
        await db.communicationPreference.create({
          data: {
            ownerType: owner.ownerType,
            ownerId: owner.ownerId,
            whatsappAllowed: false,
            smsAllowed: false,
            emailAllowed: false,
            phoneAllowed: false,
            marketingAllowed: false,
            transactionalAllowed: true,
            optOutAt: now,
            consentSource: channel || 'whatsapp_reply',
          },
        });
      }
      updatedPrefs++;
    }

    await logAudit({
      userId: undefined,
      action: 'lead_outreach.opt_out_recorded',
      module: 'marketing',
      newData: {
        phone: phone || null,
        email: email || null,
        channel: channel || 'unknown',
        outreachUpdated: updatedOutreach,
        preferencesUpdated: updatedPrefs,
        owners,
        at: now.toISOString(),
      },
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      optedOut: true,
      outreachUpdated: updatedOutreach,
      preferencesUpdated: updatedPrefs,
      owners,
    });
  } catch (error) {
    console.error('marketing/consent/unsubscribe POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
