import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth-middleware";
import { canViewB2B, canManageB2B } from "@/lib/application-manager/service";

// GET — B2B providers (restricted to Application Team / Super Admin)
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!canViewB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden: B2B access requires application.view_b2b permission' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const where: any = {};
  if (type) where.providerType = type;

  const providers = await db.b2bProvider.findMany({
    where,
    include: { _count: { select: { b2bApplications: true } } },
    orderBy: { name: "asc" },
  });

  const canManage = canManageB2B(auth.roles, auth.permissions);
  const sanitized = providers.map((p: any) => {
    if (canManage) return p;
    const { loginNote, commissionRule, paymentCondition, internalNote, email, phone, portalUrl, ...safe } = p;
    return safe;
  });

  return NextResponse.json({ providers: sanitized, success: true, data: sanitized });
}

// POST — create B2B provider
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!canManageB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden: requires manage permission' }, { status: 403 });
  }

  const body = await req.json();
  if (!body.name) return NextResponse.json({ success: false, error: 'Name required' }, { status: 400 });

  const provider = await db.b2bProvider.create({
    data: {
      providerCode: body.providerCode || `B2B-${Math.floor(Math.random() * 9999)}`,
      name: body.name,
      providerType: body.providerType || 'GLOBAL_B2B',
      countryCoverage: body.countryCoverage || '[]',
      universityCoverage: body.universityCoverage || '[]',
      contactPerson: body.contactPerson || '',
      email: body.email || '',
      phone: body.phone || '',
      portalUrl: body.portalUrl || '',
      loginNote: body.loginNote || '',
      agreementFile: body.agreementFile || '',
      commissionRule: body.commissionRule || '',
      paymentCondition: body.paymentCondition || '',
      claimStage: body.claimStage || 'NOT_CLAIMED',
      status: "ACTIVE",
      createdBy: auth.userId,
      lastReviewedAt: new Date(),
      internalNote: body.internalNote || '',
    },
  });

  await db.auditLog.create({
    data: {
      userId: auth.userId,
      action: "CREATE_B2B_PROVIDER",
      resource: "B2bProvider",
      resourceId: provider.id,
      details: JSON.stringify({ name: body.name }),
      actorRole: auth.roles[0] || '',
    },
  });

  return NextResponse.json({ provider, message: "B2B provider created.", success: true, data: provider });
}
