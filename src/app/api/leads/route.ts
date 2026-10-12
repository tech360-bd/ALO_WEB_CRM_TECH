import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from '@/lib/auth-middleware';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { normalizePhone } from '@/lib/phone-normalization';
import { rateLimitMiddleware } from '@/lib/rate-limiter';

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
const enquirySchema = z.object({
  fullName: z.string().trim().min(1).max(191),
  phone: z.string().trim().min(5).max(40),
  email: z.string().trim().max(191).pipe(z.union([z.email(), z.literal('')])).optional(),
  altPhone: shortText, source: shortText, sourceDetail: shortText,
  preferredCountry: shortText, preferredCourse: shortText, preferredLevel: shortText,
  preferredIntake: shortText, budget: shortText, englishTest: shortText,
  englishScore: shortText, currentQualification: shortText, cgpa: shortText, notes: shortText,
}).strict();

export async function POST(req: NextRequest) {
  const limited = rateLimitMiddleware(req, 'lead_create');
  if (limited) return limited;
  const parsed = enquirySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid enquiry fields or length. Assignment and control fields cannot be supplied publicly.' }, { status: 400 });
  const p = parsed.data;
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
      }, select: { id: true, leadId: true } });
      await tx.portalAuditLog.create({ data: {
        actorUserId: 'public', action: 'PUBLIC_ENQUIRY_RECEIVED', entityType: 'Lead', entityId: lead.id,
        metadata: JSON.stringify({ submittedFields: p, contactReviewCandidateIds: candidates.map(c => c.id),
          duplicateReviewRequired: candidates.length > 0, externalNotificationSent: false,
          automationDeferred: true, reason: 'Staff review required; supplied contact details are not verified identity or marketing consent.' }),
      } });
      return { leadId: lead.leadId };
    });
    // Same response for contact matches. Do not reveal another person's ID,
    // ownership, notes, scoring, or whether they are already in the CRM.
    return NextResponse.json({ lead: receipt, message: 'Enquiry received for staff review.' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Enquiry could not be saved. Please try again.' }, { status: 503 });
  }
}
