import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from '@/lib/auth-middleware';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { normalizePhone } from '@/lib/phone-normalization';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import {
  captureAttributionFromRequest,
  describeAttribution,
  mergeAttribution,
} from '@/lib/attribution/lead-attribution';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  // Lead assignments come from verified User counselors, not PortalUser IDs.
  const type = auth.userType.toUpperCase();
  if (!auth.userId || auth.identityDomain !== 'user' || !['ADMIN', 'SUPER_ADMIN', 'COUNSELOR', 'BRANCH_MANAGER'].includes(type)) return NextResponse.json({ error: 'User CRM staff access required' }, { status: 403 });
  const status = req.nextUrl.searchParams.get('status');
  const source = req.nextUrl.searchParams.get('source');
  if ((status && !['NEW','CONTACTED','QUALIFIED','CONVERTED','LOST','DUPLICATE'].includes(status)) || (source && source.length > 100)) return NextResponse.json({ error: 'Invalid lead filters' }, { status: 400 });
  try {
    const leads = await db.lead.findMany({
      where: { ...(['ADMIN', 'SUPER_ADMIN'].includes(type) ? {} : { counselorId: auth.userId }), ...(status ? { status } : {}), ...(source ? { source } : {}) },
      orderBy: { createdAt: 'desc' }, take: 200,
      select: { id: true, leadId: true, fullName: true, email: true, phone: true, source: true, preferredCountry: true, preferredCourse: true, status: true, counselorId: true, studentId: true, createdAt: true, updatedAt: true, leadScore: true, leadTier: true, notes: true },
    });
    return NextResponse.json({ leads }, {headers:{'Cache-Control':'private, no-store'}});
  } catch { return NextResponse.json({ error: 'Lead data unavailable' }, { status: 503 }); }
}

// Public enquiry intake intentionally remains public. Staff reads above do not.
const shortText = z.string().trim().max(191).optional();
// Acquisition attribution (Google Free Stack). These keys are accepted from a
// public caller because they describe how the visitor ARRIVED, not who should
// own the lead: none of them can set counselorId, status, leadScore, studentId
// or any other control field, and `.strict()` still rejects everything else.
// Every value is bounded to the VARCHAR(191) the migration created.
const attributionText = z.string().trim().max(191).optional();
const enquirySchema = z.object({
  fullName: z.string().trim().min(1).max(191),
  phone: z.string().trim().min(5).max(40),
  email: z.string().trim().max(191).pipe(z.union([z.email(), z.literal('')])).optional(),
  altPhone: shortText, source: shortText, sourceDetail: shortText,
  preferredCountry: shortText, preferredCourse: shortText, preferredLevel: shortText,
  preferredIntake: shortText, budget: shortText, englishTest: shortText,
  englishScore: shortText, currentQualification: shortText, cgpa: shortText, notes: shortText,
  landingPage: attributionText, referrer: attributionText, visitorId: attributionText,
  utmSource: attributionText, utmMedium: attributionText, utmCampaign: attributionText,
  utmContent: attributionText, utmTerm: attributionText, gclid: attributionText, fbclid: attributionText,
  // Affirmative marketing opt-in from the form's own checkbox. Absent or false
  // means no consent is recorded; there is no default-to-granted path.
  consent: z.boolean().optional(),
}).strict();

export async function POST(req: NextRequest) {
  const limited = rateLimitMiddleware(req, 'lead_create');
  if (limited) return limited;
  const parsed = enquirySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid enquiry fields or length. Assignment and control fields cannot be supplied publicly.' }, { status: 400 });
  const {
    landingPage, referrer, visitorId,
    utmSource, utmMedium, utmCampaign, utmContent, utmTerm, gclid, fbclid,
    consent,
    ...p
  } = parsed.data;
  // Attribution is resolved from the referer header and the client-reported
  // landing page together — see src/lib/attribution/lead-attribution.ts for the
  // precedence rules. It is kept out of `p` so the spread below can never write
  // an attribution key onto a column that does not expect one.
  const attribution = captureAttributionFromRequest(req, {
    body: {
      landingPage, referrer, visitorId,
      utmSource, utmMedium, utmCampaign, utmContent, utmTerm, gclid, fbclid,
    },
    landingPage: landingPage ?? null,
    visitorId: visitorId ?? null,
    referer: referrer ?? null,
  });
  const phone = normalizePhone(p.phone);
  if (!/^\d{7,15}$/.test(phone || '')) return NextResponse.json({ error: 'A valid phone number is required.' }, { status: 400 });
  const email = p.email?.toLowerCase() || null;
  try {
    const receipt = await db.$transaction(async tx => {
      const candidates = await tx.lead.findMany({ where: { OR: [{ phone }, ...(email ? [{ email }] : [])] }, select: { id: true }, take: 2 });
      const lead = await tx.lead.create({ data: {
        ...p, phone: phone!, email, source: 'WEBSITE',
        leadId: `ALO-L-${randomUUID()}`, status: 'NEW', welcomeSent: false,
        // rawSubmission is VARCHAR(191) in the existing schema. Store the
        // bounded payload in the existing LongText audit, not that column.
        // A brand-new lead's first touch and last touch are the same event.
        ...mergeAttribution(attribution, {}),
      }, select: { id: true, leadId: true } });
      await tx.portalAuditLog.create({ data: {
        actorUserId: 'public', action: 'PUBLIC_ENQUIRY_RECEIVED', entityType: 'Lead', entityId: lead.id,
        metadata: JSON.stringify({ submittedFields: p, attribution: describeAttribution(attribution), contactReviewCandidateIds: candidates.map(c => c.id),
          duplicateReviewRequired: candidates.length > 0, externalNotificationSent: false,
          automationDeferred: true, reason: 'Staff review required; supplied contact details are not verified identity or marketing consent.' }),
      } });
      return { leadId: lead.leadId };
    });
    // Record marketing consent ONLY when the visitor actively ticked the box.
    // This runs after the lead is committed: a consent write must never roll
    // back a saved enquiry, and a failure here must not fail the submission.
    if (consent === true) {
      try {
        const { grantConsent } = await import('@/lib/marketing-consent');
        await grantConsent({
          visitorId: attribution.visitorId ?? undefined,
          email: email ?? undefined,
          consentSource: 'PUBLIC_ENQUIRY_FORM',
          consentMethod: 'CHECKBOX',
          ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined,
          campaign: attribution.utmCampaign ?? undefined,
          medium: attribution.utmMedium ?? undefined,
        });
      } catch (consentError) {
        console.error('[public-enquiry] marketing consent could not be recorded', {
          reason: consentError instanceof Error ? consentError.message : String(consentError),
        });
      }
    }
    // Same response for contact matches. Do not reveal another person's ID,
    // ownership, notes, scoring, or whether they are already in the CRM.
    // The response shape is a deliberate security contract, pinned by
    // tests/unit/public-leads-security.test.ts: a contact match must return
    // exactly the same receipt as a new lead, so nothing about another person's
    // record is revealed. The consent result is therefore NOT echoed back — the
    // caller already knows what it sent, and adding a field here would weaken
    // that guarantee for no benefit.
    return NextResponse.json({ lead: receipt, message: 'Enquiry received for staff review.' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Enquiry could not be saved. Please try again.' }, { status: 503 });
  }
}
