import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logAuditAction } from '@/lib/auth-middleware';
import { requirePartnerContext, requirePartnerSuperAdmin } from '@/lib/partner-tenant-guard';
import { getQuota } from '@/lib/access-check-engine';
import { createHash, randomBytes } from 'node:crypto';
import { sendEmail } from '@/lib/email-service';

/** Partner-side roles a Partner Super Admin is allowed to grant (§6). */
const ASSIGNABLE_PARTNER_ROLES = [
  'PARTNER_COUNSELOR',
  'PARTNER_APPLICATION_ASSISTANT',
  'PARTNER_MARKETING_ASSISTANT',
  'PARTNER_DOCUMENT_ASSISTANT',
  'PARTNER_VIEWER',
];

function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  return !origin || new URL(origin).origin === new URL(request.url).origin;
}

// GET: List users in partner tenant
export async function GET(req: NextRequest) {
  const ctx = await requirePartnerContext(req);
  if (ctx instanceof NextResponse) return ctx;
  const partnerId = ctx.partnerId;

  try {
    const users = await db.portalUser.findMany({
      where: {
        partnerProfile: { partnerId },
      },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        status: true,
        createdAt: true,
        partnerProfile: { select: { partnerRole: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const seatLimit = await getQuota('PARTNER', partnerId, 'user_seats');
    const currentCount = users.filter((user) => ['active', 'pending_activation'].includes(user.status.toLowerCase())).length;

    return NextResponse.json({
      success: true,
      partnerId,
      callerRole: ctx.partnerRole,
      seatLimit,
      currentCount,
      users,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch partner users' }, { status: 503 });
  }
}

// POST: Create partner employee within seat limit
export async function POST(req: NextRequest) {
  // Only the Partner Super Admin may create users in the tenant (§6).
  const ctx = await requirePartnerSuperAdmin(req);
  if (ctx instanceof NextResponse) return ctx;
  if (!sameOrigin(req)) return NextResponse.json({ success: false, error: 'Cross-origin partner user creation denied.' }, { status: 403 });
  const partnerId = ctx.partnerId;

  try {
    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const requestedRole = String(body?.partnerRole || 'PARTNER_COUNSELOR').toUpperCase();

    if (!name || !email) {
      return NextResponse.json({ success: false, error: 'Name and email are required.' }, { status: 400 });
    }
    if (name.length > 200 || email.length > 254) {
      return NextResponse.json({ success: false, error: 'Name or email exceeds the allowed length.' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'A valid email address is required.' }, { status: 400 });
    }
    // A Partner Super Admin can only create partner-side roles, never ALO
    // roles and never a second Partner Super Admin (§6).
    if (!ASSIGNABLE_PARTNER_ROLES.includes(requestedRole)) {
      return NextResponse.json(
        {
          success: false,
          error: 'You can only create partner roles within your ALO-approved package.',
          assignableRoles: ASSIGNABLE_PARTNER_ROLES,
        },
        { status: 403 },
      );
    }

    const seatLimit = await getQuota('PARTNER', partnerId, 'user_seats');

    // Duplicate check before attempting creation, for a clear error message.
    const existing = await db.portalUser.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A user with this email already exists.' },
        { status: 409 },
      );
    }

    // Generate the activation credential before the transaction, but store
    // only its one-way hash. User creation and token storage commit together.
    const token = randomBytes(32).toString('hex');
    let created;
    try {
      created = await db.$transaction(async (tx) => {
        // Lock stable tenant rows so invitations from different admins in the
        // same partner account serialize before the final-seat count.
        await tx.partnerProfile.updateMany({ where: { partnerId }, data: { updatedAt: new Date() } });
        const currentUsers = await tx.portalUser.count({
          where: { partnerProfile: { partnerId }, status: { in: ['active', 'pending_activation'] } },
        });

        if (currentUsers >= seatLimit) {
          throw Object.assign(new Error('SEAT_LIMIT_REACHED'), {
            code: 'SEAT_LIMIT_REACHED',
            currentCount: currentUsers,
          });
        }

        const newUser = await tx.portalUser.create({
          data: {
            name,
            email,
            userType: 'PARTNER',
            // Account is inactive until the invited user sets a password via
            // the activation flow. No password is ever issued in plaintext.
            status: 'pending_activation',
            passwordHash: '',
            partnerProfile: {
              create: {
                partnerId,
                partnerRole: requestedRole,
                companyName: typeof body?.companyName === 'string' ? body.companyName.trim().slice(0, 200) : '',
                contactPerson: name,
                approvalStatus: 'approved',
              },
            },
          },
          select: { id: true, name: true, email: true, status: true, createdAt: true },
        });
        await tx.passwordResetToken.create({
          data: {
            userId: newUser.id,
            token: '',
            tokenHash: createHash('sha256').update(`partner-activation:${token}`).digest('hex'),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });
        return newUser;
      });
    } catch (txError: any) {
      if (txError?.code === 'SEAT_LIMIT_REACHED') {
        return NextResponse.json(
          {
            success: false,
            error:
              'Your current partner user limit has been reached. Please request additional seats from ALO Education.',
            currentCount: txError.currentCount,
            seatLimit,
          },
          { status: 403 },
        );
      }
      throw txError;
    }

    const currentCount = await db.portalUser.count({ where: { partnerProfile: { partnerId }, status: { in: ['active', 'pending_activation'] } } });
    const activationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://aloeducation.com'}/partner/activate?token=${token}`;
    const delivery = await sendEmail({ to: email, subject: 'Activate your ALO Education partner account', text: `Your partner organisation invited you to ALO Education. Set your own password at ${activationUrl}. This invitation expires in 24 hours.`, html: `<p>Your partner organisation invited you to ALO Education.</p><p><a href="${activationUrl}">Activate your account and set a password</a></p><p>This invitation expires in 24 hours.</p>` });
    await logAuditAction(ctx, 'PARTNER_USER_CREATED', 'PortalUser', created.id, {
      partnerId,
      email,
      name,
      partnerRole: requestedRole,
      seatLimit,
      seatsUsedAfter: currentCount,
    });

    return NextResponse.json({
      success: true,
      message: delivery.success ? 'Invitation sent. The user can activate their account and set a password.' : 'Account created, but the activation email could not be delivered. Please retry the invitation.',
      invitationSent: delivery.success,
      user: { ...created, partnerRole: requestedRole },
      seatUsage: {
        current: currentCount,
        limit: seatLimit,
        available: Math.max(0, seatLimit - currentCount),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to create partner user.' },
      { status: 500 },
    );
  }
}
