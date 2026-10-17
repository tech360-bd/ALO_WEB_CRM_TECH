import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireMarketingManager } from '@/lib/auth-rbac';
import { logAudit } from '@/lib/audit';

/**
 * Block contact by phone/email.
 * - Marks LeadOutreach rows as blocked.
 * - Sets CommunicationPreference.marketingAllowed=false + optOutAt for matching owners.
 * - Audits `lead_outreach.blocked`.
 */
export async function POST(request: NextRequest) {
  try {
    const authOrResponse = await requireMarketingManager(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;
    const auth = authOrResponse;

    const body = await request.json();
    const { phone, email, reason } = body;

    if (!phone && !email) {
      return NextResponse.json(
        { error: 'phone or email is required' },
        { status: 400 }
      );
    }

    const now = new Date();
    const where: { OR: Array<Record<string, string>> } = { OR: [] };
    if (phone) where.OR.push({ phone });
    if (email) where.OR.push({ email });

    const result = await db.leadOutreach.updateMany({
      where,
      data: {
        consentStatus: 'blocked',
        blockedReason: reason || 'manual_block',
        status: 'blocked',
      },
    });

    // Block CommunicationPreference for matching Lead/Student/Partner owners
    const owners: Array<{ ownerType: string; ownerId: string }> = [];

    const leadClauses: Array<Record<string, string>> = [];
    if (phone) leadClauses.push({ phone }, { whatsappNumber: phone });
    if (email) leadClauses.push({ email });
    if (leadClauses.length > 0) {
      const leads = await db.lead.findMany({ where: { OR: leadClauses }, select: { id: true } });
      for (const l of leads) owners.push({ ownerType: 'LEAD', ownerId: l.id });
    }

    const studentClauses: Array<Record<string, string>> = [];
    if (phone) studentClauses.push({ phone }, { whatsappNumber: phone });
    if (email) studentClauses.push({ email });
    if (studentClauses.length > 0) {
      const students = await db.student.findMany({ where: { OR: studentClauses }, select: { id: true } });
      for (const s of students) owners.push({ ownerType: 'STUDENT', ownerId: s.id });
    }

    const partnerClauses: Array<Record<string, string>> = [];
    if (phone) partnerClauses.push({ phone });
    if (email) partnerClauses.push({ email });
    if (partnerClauses.length > 0) {
      const partners = await db.partner.findMany({ where: { OR: partnerClauses }, select: { id: true } });
      for (const p of partners) owners.push({ ownerType: 'PARTNER', ownerId: p.id });
    }

    let prefsBlocked = 0;
    for (const owner of owners) {
      const existing = await db.communicationPreference.findUnique({
        where: { ownerType_ownerId: owner },
      });
      if (existing) {
        await db.communicationPreference.update({
          where: { id: existing.id },
          data: {
            whatsappAllowed: false,
            smsAllowed: false,
            emailAllowed: false,
            phoneAllowed: false,
            marketingAllowed: false,
            optOutAt: now,
            consentSource: 'manual_block',
          },
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
            transactionalAllowed: false,
            optOutAt: now,
            consentSource: 'manual_block',
          },
        });
      }
      prefsBlocked++;
    }

    await logAudit({
      userId: auth.user.id,
      action: 'lead_outreach.blocked',
      module: 'marketing',
      newData: {
        phone: phone || null,
        email: email || null,
        reason: reason || 'manual_block',
        outreachBlocked: result.count,
        preferencesBlocked: prefsBlocked,
        owners,
        at: now.toISOString(),
      },
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      blocked: true,
      outreachBlocked: result.count,
      preferencesBlocked: prefsBlocked,
      owners,
    });
  } catch (error) {
    console.error('marketing/lead-outreach/block POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
