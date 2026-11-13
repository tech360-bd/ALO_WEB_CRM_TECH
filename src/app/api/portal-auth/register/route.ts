import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getRequestIp, issueEmailOtp } from '@/lib/auth/email-otp';
import { allocateIdentifier } from '@/lib/identity/student-id';
import { createRegistrationLead } from '@/lib/crm/registration-lead';

// Acquisition attribution forwarded by the registration form. Bounded to the
// VARCHAR(191) the migration created, and `.strict()` still rejects every other
// unknown key, so this cannot be used to set a control field.
const attributionField = z.string().trim().max(191).optional();
const schema = z.object({
  name: z.string().trim().min(1).max(191), email: z.string().trim().max(191).pipe(z.email()).transform(s => s.toLowerCase()),
  password: z.string().min(8).max(200), phone: z.string().trim().max(40).optional(),
  portalType: z.enum(['student', 'partner']),
  attribution: z.object({
    landingPage: attributionField, referrer: attributionField, visitorId: attributionField,
    utmSource: attributionField, utmMedium: attributionField, utmCampaign: attributionField,
    utmContent: attributionField, utmTerm: attributionField, gclid: attributionField, fbclid: attributionField,
  }).strict().optional(),
}).strict();

export async function POST(request: Request) {
  try {
    const raw = await request.json().catch(() => null);
    if (raw?.portalType === 'employee') return NextResponse.json({ success: false, error: 'Employee registration is not allowed. Contact admin.' }, { status: 403 });
    const parsed = schema.safeParse(raw);
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Valid name, email, password (8–200 characters), phone and portal type are required.' }, { status: 400 });
    const p = parsed.data;
    const passwordHash = await bcrypt.hash(p.password, 12);
    const result = await db.$transaction(async tx => {
      if (await tx.portalUser.findUnique({ where: { email: p.email } }) || await tx.user.findUnique({ where: { email: p.email } })) {
        throw Object.assign(new Error('Duplicate account'), { code: 'EMAIL_EXISTS' });
      }
      const user = await tx.portalUser.create({ data: {
        name: p.name, email: p.email, phone: p.phone || '', passwordHash,
        userType: p.portalType === 'student' ? 'STUDENT' : 'PARTNER',
        status: p.portalType === 'student' ? 'pending_verification' : 'pending', firstLoginRequired: true,
      }, select: { id: true, name: true, email: true, phone: true, userType: true, status: true, firstLoginRequired: true } });
      if (p.portalType === 'student') {
        const studentId = await allocateIdentifier(tx, 'AE');
        const profile = await tx.portalStudentProfile.create({ data: { userId: user.id, studentId, fullName: p.name } });
        const crm = await createRegistrationLead(tx, { domain: 'portal', userId: user.id, studentId, name: p.name, email: p.email, phone: p.phone || '', attribution: p.attribution ?? null });
        // Lead counselor IDs are User IDs. Do NOT write them into the Portal
        // profile's untyped counselor field as if they were PortalUser IDs.
        await tx.portalNotification.create({ data: { userId: user.id, studentProfileId: profile.id,
          title: 'Registration received', message: 'Verify your email before signing in. Your enquiry is recorded; portal counselor mapping requires staff review.', type: 'info' } });
        return { user, leadId: crm.leadId, counselorAssigned: Boolean(crm.counselorId), portalCounselorMapped: false };
      }
      await tx.partnerProfile.create({ data: { userId: user.id, partnerId: await allocateIdentifier(tx, 'AEP'), contactPerson: p.name } });
      return { user };
    }, { timeout: 20000 });
    const issued = await issueEmailOtp({ userId: result.user.id, email: p.email, ipAddress: getRequestIp(request) }).catch(() => ({ ok: false as const, reason: 'delivery_failed' as const }));
    if (!issued.ok) return NextResponse.json({ success: false, accountCreated: true,
      error: issued.reason === 'rate_limited' ? 'Verification email limit reached. Try later.' : 'Account and enquiry recorded but verification email could not be delivered. Retry verification later.',
    }, { status: issued.reason === 'rate_limited' ? 429 : 503 });
    return NextResponse.json({ success: true, requireVerification: true, ...result,
      message: p.portalType === 'partner' ? 'Verify your email; partner access requires separate staff approval.' : 'Verify your email before signing in. Your enquiry is recorded.',
    }, { status: 201 });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (['EMAIL_EXISTS', 'P2002'].includes(code || '')) return NextResponse.json({ success: false, error: 'An account with this email already exists or registration conflicted. Sign in or retry.' }, { status: 409 });
    return NextResponse.json({ success: false, error: 'Registration could not be completed. No account/enquiry transaction committed.' }, { status: 503 });
  }
}
