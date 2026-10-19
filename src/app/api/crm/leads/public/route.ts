import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createLeadWithReference } from '@/lib/lead-reference';
import {
  captureAttributionFromRequest,
  describeAttribution,
  newLeadAttribution,
  toLeadFormColumns,
} from '@/lib/attribution/lead-attribution';

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
      // Marketing consent must be an explicit, affirmative act by the visitor.
      // It is read from the submission and never assumed.
      consent,
      marketingConsent,
    } = body;

    if (!name || !phone || !email) {
      return NextResponse.json(
        { success: false, error: 'Name, phone, and email are required.' },
        { status: 400 }
      );
    }

    // Acquisition attribution (Google Free Stack). Captured from the request
    // URL, the `referer` header and the attribution keys the form forwarded,
    // so a lead that converts on an SPA route still carries the UTM values it
    // originally arrived with.
    const attribution = captureAttributionFromRequest(request, {
      body: body as Record<string, unknown>,
      landingPage: typeof body?.landingPage === 'string' ? body.landingPage : null,
      visitorId: typeof body?.visitorId === 'string' ? body.visitorId : null,
    });

    // No destination is a legitimate outcome: many visitors enquire before
    // choosing a country. The old code substituted 'United Kingdom' here, which
    // wrote a country the visitor never named into three tables and then fed it
    // to lead scoring ("Has preferred destination" = +15 points) and to the
    // counselor's queue. An unknown destination must stay unknown.
    const country = preferredCountry || destination || '';
    const leadCode = `LEAD-${Date.now().toString(36).toUpperCase()}`;
    const consentGranted = consent === true || marketingConsent === true;

    // 1. Create Lead in LeadForm (public web capture)
    const leadFormRecord = await db.leadForm.create({
      data: {
        name,
        phone,
        email,
        preferredCountry: country,
        // Only what the visitor actually selected. 'Postgraduate', 'September
        // 2026' and 'IELTS' used to be substituted here; those invented values
        // were indistinguishable from real answers downstream.
        preferredLevel: preferredLevel || '',
        preferredSubject: preferredSubject || '',
        intake: intake || '',
        budget: budget || '',
        englishTest: englishTest || '',
        englishScore: englishScore || '',
        message: message || (service ? `Service requested: ${service}` : ''),
        source: source || 'public_website',
        status: 'pending',
        ...toLeadFormColumns(attribution),
      },
    }).catch(() => null);

    // 2. Create Lead in MarketingLead (CRM pipeline)
    // `ieltsScore` is a non-nullable Float whose schema default is 0. Writing a
    // parsed value only when the visitor supplied a number keeps 0 meaning "no
    // score recorded" rather than "scored zero". The authoritative English test
    // fields are `Lead.englishTest` / `Lead.englishScore`.
    const parsedEnglishScore = Number.parseFloat(typeof englishScore === 'string' ? englishScore : '');
    const marketingLeadRecord = await db.marketingLead.create({
      data: {
        name,
        phone,
        email,
        destination: country,
        level: preferredLevel || '',
        intake: intake || '',
        budget: budget || '',
        ...(Number.isFinite(parsedEnglishScore) ? { ieltsScore: parsedEnglishScore } : {}),
        source: source || 'website_inquiry',
        sourceDetail: `[Subject: ${preferredSubject || 'not supplied'}] [Test: ${englishTest || 'not supplied'}] ${message || ''}`,
        status: 'new',
        // Score and hot-lead flag are computed below by the same
        // `scoreLead()` engine every other lead goes through. They used to be
        // hard-coded to 75 / true here, which marked every public enquiry as a
        // hot lead before anything was known about it.
        //
        // Consent is likewise no longer assumed. Recording `consent: true` for a
        // visitor who was never asked created an affirmative marketing-consent
        // record that ALO could not substantiate.
        consent: consentGranted,
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
            preferredLevel: preferredLevel || '',
            preferredIntake: intake || '',
            budget: budget || '',
            englishTest: englishTest || '',
            englishScore: englishScore || '',
            notes: message || '',
            rawSubmission: JSON.stringify(body),
            status: 'NEW',
            // Full attribution triplet + first/last touch. For a brand-new lead
            // the two are the same; `mergeAttribution` keeps first touch
            // immutable on later conversions by this visitor.
            ...newLeadAttribution(attribution),
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

        // Score with the shared engine, then propagate the REAL result to the
        // MarketingLead copy so the two pipelines cannot disagree. Previously
        // MarketingLead kept its hard-coded 75 while Lead held the computed
        // score.
        const scored = await scoreLead(crmLead.id).catch(() => null);
        if (scored && marketingLeadRecord?.id) {
          await db.marketingLead
            .update({
              where: { id: marketingLeadRecord.id },
              data: { score: scored.score, hotLead: scored.tier === 'HOT' || scored.tier === 'URGENT' },
            })
            .catch(() => null);
        }
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
        afterData: JSON.stringify({
          name,
          email,
          phone,
          country,
          crmLeadId,
          counselorAssigned,
          assignmentReason,
          consentGranted,
          // Attribution is stored as its description, not the raw record, so the
          // audit log stays free of click identifiers.
          attribution: describeAttribution(attribution),
        }),
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
