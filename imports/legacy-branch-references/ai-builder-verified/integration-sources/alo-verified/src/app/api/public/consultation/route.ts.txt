import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';

/**
 * Public consultation form (creates Lead).
 * - No auth required.
 * - Validates name + phone.
 * - Deduplicates by phone/email — if existing lead found, append a note instead of creating.
 * - Audits `public.consultation_submitted`.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      phone,
      email,
      whatsappNumber,
      preferredCountry,
      preferredCourse,
      preferredIntake,
      englishTestType,
      englishTestScore,
      highestEducation,
      notes,
      source,
      sourceId,
    } = body;

    // Validate name + phone
    if (!firstName || typeof firstName !== 'string' || !firstName.trim()) {
      return NextResponse.json({ error: 'firstName is required' }, { status: 400 });
    }
    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return NextResponse.json({ error: 'phone is required' }, { status: 400 });
    }

    const cleanPhone = phone.trim();
    const cleanEmail = email?.toString().trim().toLowerCase() || null;
    const cleanWhatsapp = whatsappNumber?.toString().trim() || cleanPhone;

    // Dedup: find existing lead by phone/whatsapp/email
    const dedupeClauses: Array<Record<string, string>> = [
      { phone: cleanPhone },
      { whatsappNumber: cleanPhone },
      { whatsappNumber: cleanWhatsapp },
    ];
    if (cleanEmail) {
      dedupeClauses.push({ email: cleanEmail });
    }

    const existingLead = await db.lead.findFirst({
      where: { OR: dedupeClauses },
    });

    if (existingLead) {
      // Append a note to existing lead
      const noteText = `[Consultation re-submission ${new Date().toISOString()}] ${notes || '(no message)'}`;
      await db.leadNote.create({
        data: {
          leadId: existingLead.id,
          note: noteText,
          noteType: 'general',
          addedBy: null,
        },
      });

      // Update lastContactedAt
      await db.lead.update({
        where: { id: existingLead.id },
        data: { lastContactedAt: new Date() },
      });

      await logAudit({
        userId: undefined,
        action: 'public.consultation_submitted',
        module: 'public',
        recordId: existingLead.id,
        newData: {
          deduplicated: true,
          existingLeadId: existingLead.id,
          phone: cleanPhone,
          email: cleanEmail,
        },
        ip: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });

      return NextResponse.json({
        lead: existingLead,
        deduplicated: true,
        message: 'You already have a consultation request on file. We will contact you soon.',
      });
    }

    // Generate next leadId in LEAD-YYYYNNNN format
    const year = new Date().getFullYear();
    const lastLead = await db.lead.findFirst({
      where: { leadId: { startsWith: `LEAD-${year}` } },
      orderBy: { leadId: 'desc' },
      select: { leadId: true },
    });
    let nextNum = 1;
    if (lastLead?.leadId) {
      const parts = lastLead.leadId.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    const leadId = `LEAD-${year}${nextNum.toString().padStart(4, '0')}`;

    const lead = await db.lead.create({
      data: {
        leadId,
        firstName: firstName.trim(),
        lastName: (lastName || '').trim() || '',
        email: cleanEmail,
        phone: cleanPhone,
        whatsappNumber: cleanWhatsapp,
        source: source || 'website',
        sourceId: sourceId || null,
        preferredCountry: preferredCountry || null,
        preferredCourse: preferredCourse || null,
        preferredIntake: preferredIntake || null,
        englishTestType: englishTestType || null,
        englishTestScore: englishTestScore ? String(englishTestScore) : null,
        highestEducation: highestEducation || null,
        notes: notes || 'Public consultation form submission',
        status: 'new',
        temperature: 'warm',
      },
    });

    // Append initial note
    if (notes) {
      await db.leadNote.create({
        data: {
          leadId: lead.id,
          note: notes,
          noteType: 'general',
          addedBy: null,
        },
      });
    }

    // Create LeadOutreach record with compliant source
    await db.leadOutreach.create({
      data: {
        leadId: lead.id,
        phone: cleanPhone,
        email: cleanEmail,
        source: 'opted_in_form',
        consentStatus: 'opt_in',
        consentSource: 'form',
        channel: 'call',
        lastOutreachAt: new Date(),
        status: 'active',
      },
    }).catch(() => null);

    await logAudit({
      userId: undefined,
      action: 'public.consultation_submitted',
      module: 'public',
      recordId: lead.id,
      newData: {
        leadId: lead.leadId,
        firstName: lead.firstName,
        phone: lead.phone,
        email: lead.email,
        source: lead.source,
      },
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ lead, deduplicated: false }, { status: 201 });
  } catch (error) {
    console.error('public/consultation POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
