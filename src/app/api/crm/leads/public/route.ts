import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createLeadWithReference } from '@/lib/lead-reference';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      phone,
      email,
      preferredCountry,
      destination,
      preferredLevel,
      preferredSubject,
      intake,
      budget,
      englishTest,
      englishScore,
      message,
      service,
      source,
    } = body;

    if (!name || !phone || !email) {
      return NextResponse.json(
        { success: false, error: 'Name, phone, and email are required.' },
        { status: 400 }
      );
    }

    const country = preferredCountry || destination || 'United Kingdom';
    const leadCode = `LEAD-${Date.now().toString(36).toUpperCase()}`;

    // 1. Create Lead in LeadForm (public web capture)
    const leadFormRecord = await db.leadForm.create({
      data: {
        name,
        phone,
        email,
        preferredCountry: country,
        preferredLevel: preferredLevel || 'Postgraduate',
        preferredSubject: preferredSubject || '',
        intake: intake || 'September 2026',
        budget: budget || '',
        englishTest: englishTest || 'IELTS',
        englishScore: englishScore || '',
        message: message || (service ? `Service requested: ${service}` : ''),
        source: source || 'public_website',
        status: 'pending',
      },
    }).catch(() => null);

    // 2. Create Lead in MarketingLead (CRM pipeline)
    const marketingLeadRecord = await db.marketingLead.create({
      data: {
        name,
        phone,
        email,
        destination: country,
        level: preferredLevel || 'Postgraduate',
        intake: intake || 'September 2026',
        budget: budget || '',
        ieltsScore: parseFloat(englishScore) || 0,
        source: source || 'website_inquiry',
        sourceDetail: `[Subject: ${preferredSubject || 'N/A'}] [Test: ${englishTest || 'N/A'}] ${message || ''}`,
        status: 'new',
        score: 75,
        hotLead: true,
        consent: true,
      },
    }).catch(() => null);

    // 3. Create/link the record in the main CRM `Lead` table and run it
    // through the SAME lead-scoring / counselor auto-assignment / follow-up
    // pipeline used by /api/leads. This closes a gap where leads captured on
    // country/destination/test-prep landing pages (which post here) were
    // never scored or assigned a counselor, unlike leads captured via the
    // main public lead form. LeadForm and MarketingLead writes above are
    // preserved unchanged for backward compatibility — nothing is removed.
    let crmLeadId: string | null = null;
    let counselorAssigned = false;
    let assignmentReason = '';
    try {
      const { findDuplicateLead, scoreLead, autoAssignCounselor, createFollowUpTask } =
        await import('@/lib/crm-automation');

      const duplicateLeadId = await findDuplicateLead({ email, phone });

      if (duplicateLeadId) {
        crmLeadId = duplicateLeadId;
        const existingLead = await db.lead.findUnique({ where: { id: duplicateLeadId } });
        if (existingLead && !existingLead.counselorId) {
          const assignment = await autoAssignCounselor(duplicateLeadId);
          counselorAssigned = !!assignment.counselorId;
          assignmentReason = assignment.reason;
        }
      } else {
        // §125 — one canonical reference format (LEAD-2026-XXXXX) with a
        // collision-safe allocator; the old count()+1 raced with concurrent forms.
        const crmLead = await createLeadWithReference<{ id: string; source: string }>(db, {
            fullName: name,
            email,
            phone,
            source: source || 'WEBSITE',
            sourceDetail: `Public inquiry form (${source || 'website_inquiry'})${service ? ` — service: ${service}` : ''}`,
            preferredCountry: country,
            preferredLevel: preferredLevel || 'Postgraduate',
            preferredIntake: intake || 'September 2026',
            budget: budget || '',
            englishTest: englishTest || 'IELTS',
            englishScore: englishScore || '',
            notes: message || '',
            rawSubmission: JSON.stringify(body),
            status: 'NEW',
        });
        crmLeadId = crmLead.id;

        await db.timelineEvent.create({
          data: {
            studentId: '',
            leadId: crmLead.id,
            stage: 'lead',
            type: 'LEAD_CREATED',
            title: 'New lead created',
            description: `Lead came via public inquiry form (${crmLead.source})`,
          },
        }).catch(() => {});

        await scoreLead(crmLead.id).catch(() => {});
        const assignment = await autoAssignCounselor(crmLead.id);
        counselorAssigned = !!assignment.counselorId;
        assignmentReason = assignment.reason;
        await createFollowUpTask(crmLead.id, 1).catch(() => {});

        if (!assignment.counselorId) {
          // Record the failure explicitly — never silently skip or assign a
          // random counselor.
          console.error('[public-lead->crm] counselor auto-assignment failed', {
            leadId: crmLead.id,
            reason: assignment.reason,
          });
        }
      }
    } catch (automationError) {
      // The LeadForm/MarketingLead records above have already been written
      // (or attempted), so the visitor's submission is not lost even if this
      // automation pipeline fails. Log clearly for follow-up/repair.
      console.error('[public-lead->crm] automation pipeline failed', {
        error: automationError instanceof Error ? automationError.message : String(automationError),
      });
    }

    // 4. Create Audit Log
    await db.crmAuditLog.create({
      data: {
        actorUserId: 'public_visitor',
        actorRole: 'GUEST',
        action: 'PUBLIC_LEAD_SUBMITTED',
        targetCollection: 'LeadForm',
        targetId: leadFormRecord?.id || marketingLeadRecord?.id || leadCode,
        afterData: JSON.stringify({ name, email, phone, country, crmLeadId, counselorAssigned, assignmentReason }),
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your study abroad consultation request has been submitted successfully.',
      leadId: leadFormRecord?.id || marketingLeadRecord?.id || leadCode,
      crmLeadId,
      data: {
        name,
        email,
        phone,
        country,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to submit consultation inquiry.' },
      { status: 500 }
    );
  }
}
