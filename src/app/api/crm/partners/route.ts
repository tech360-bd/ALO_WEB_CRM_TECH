import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

const PARTNER_MANAGEMENT_ROLES = ['partner_manager', 'super_admin', 'admin', 'ceo', 'branch_manager'];
const APPROVAL_STATES = new Set(['pending', 'approved', 'rejected', 'suspended', 'terminated']);

export async function GET(request: NextRequest) {
  return withAuth(async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      const status = (searchParams.get('status') || '').toLowerCase();
      const city = (searchParams.get('city') || '').trim().slice(0, 100);
      const search = (searchParams.get('search') || '').trim().slice(0, 191);
      const page = Math.max(1, Math.min(100_000, Number.parseInt(searchParams.get('page') || '1', 10) || 1));
      const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get('limit') || '20', 10) || 20));
      if (status && !APPROVAL_STATES.has(status)) {
        return NextResponse.json({ success: false, error: 'Invalid partner status.' }, { status: 400 });
      }

      const where: any = {};
      if (status === 'active') where.approvalStatus = { in: ['approved', 'active'] };
      else if (status) where.approvalStatus = status;
      if (city) where.city = { contains: city };
      if (search) where.OR = [
        { companyName: { contains: search } },
        { contactPerson: { contains: search } },
      ];

      const [partners, partnerTotal, leads, leadTotal] = await Promise.all([
        db.partnerProfile.findMany({
          where,
          select: {
            id: true, userId: true, partnerId: true, companyName: true, contactPerson: true,
            businessType: true, city: true, address: true, approvalStatus: true,
            totalLeads: true, activeStudents: true, commissionPending: true, commissionPaid: true,
            createdAt: true, updatedAt: true,
            user: { select: { email: true, status: true, emailVerified: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.partnerProfile.count({ where }),
        db.partnerLead.findMany({ orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
        db.partnerLead.count(),
      ]);

      return NextResponse.json({
        success: true,
        data: { partners, leads },
        total: { partners: partnerTotal, leads: leadTotal },
        page,
        totalPages: Math.ceil(partnerTotal / limit),
      });
    } catch {
      return NextResponse.json({ success: false, error: 'Partner data is temporarily unavailable.' }, { status: 503 });
    }
  }, { requireRoles: PARTNER_MANAGEMENT_ROLES })(request);
}

// Partner self-registration is intentionally the only public account-creation
// path. Staff approve the resulting, email-verified profile using PUT below.
export async function POST(request: NextRequest) {
  return withAuth(async () => NextResponse.json({
    success: false,
    error: 'Create a partner account through the registration and email-verification workflow first.',
  }, { status: 405 }), { requireRoles: PARTNER_MANAGEMENT_ROLES })(request);
}

export async function PUT(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json().catch(() => null);
      const id = typeof body?.id === 'string' ? body.id.trim() : '';
      if (!id) return NextResponse.json({ success: false, error: 'Partner id is required.' }, { status: 400 });

      const existing = await db.partnerProfile.findUnique({
        where: { id },
        include: { user: { select: { id: true, email: true, status: true, emailVerified: true } } },
      });
      if (!existing) return NextResponse.json({ success: false, error: 'Partner not found.' }, { status: 404 });

      const approvalStatus = typeof body?.approvalStatus === 'string' ? body.approvalStatus.toLowerCase() : undefined;
      if (approvalStatus && !APPROVAL_STATES.has(approvalStatus)) {
        return NextResponse.json({ success: false, error: 'Invalid partner status.' }, { status: 400 });
      }
      const updates: Record<string, string> = {};
      for (const field of ['companyName', 'contactPerson', 'city', 'businessType', 'address'] as const) {
        if (body?.[field] !== undefined) {
          if (typeof body[field] !== 'string' || body[field].length > 500) {
            return NextResponse.json({ success: false, error: `Invalid ${field}.` }, { status: 400 });
          }
          updates[field] = body[field].trim();
        }
      }

      if (approvalStatus === 'approved' && !existing.user.emailVerified) {
        return NextResponse.json({ success: false, error: 'The partner must verify their email before approval.' }, { status: 409 });
      }
      const nextUserStatus = approvalStatus === 'approved'
        ? 'active'
        : approvalStatus === 'pending'
          ? 'pending'
          : approvalStatus === 'suspended'
            ? 'suspended'
            : approvalStatus === 'rejected' || approvalStatus === 'terminated'
              ? 'blocked'
              : undefined;

      const result = await db.$transaction(async (tx) => {
        const partner = await tx.partnerProfile.update({
          where: { id },
          data: { ...updates, ...(approvalStatus ? { approvalStatus } : {}) },
        });
        if (nextUserStatus) {
          await tx.portalUser.update({ where: { id: existing.user.id }, data: { status: nextUserStatus } });
          if (nextUserStatus !== 'active') {
            await tx.portalSession.updateMany({
              where: { userId: existing.user.id, revokedAt: null },
              data: { revokedAt: new Date() },
            });
          }
        }
        return partner;
      });

      await logAuditAction(auth, approvalStatus ? 'partner_approval_status_changed' : 'partner_profile_updated', 'PartnerProfile', id, {
        previousStatus: existing.approvalStatus,
        nextStatus: approvalStatus || existing.approvalStatus,
        fields: Object.keys(updates),
      });
      return NextResponse.json({ success: true, data: result });
    } catch {
      return NextResponse.json({ success: false, error: 'Partner update could not be completed.' }, { status: 503 });
    }
  }, { requireRoles: PARTNER_MANAGEMENT_ROLES })(request);
}
