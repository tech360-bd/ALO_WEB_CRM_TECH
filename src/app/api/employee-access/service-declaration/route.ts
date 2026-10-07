// ============================================================
// /api/employee-access/service-declaration
// SERVICE CHARGE / MONEY BACK DECLARATION (spec):
//   Declaration document used officially; must be approved by authorized
//   ALO management before payment-related stages.
//   GET  → official template (staff only)
//   POST → build a validated declaration for an application, log audit.
// ============================================================

import { NextResponse } from 'next/server';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import {
  SERVICE_CHARGE_DECLARATION_TEMPLATE,
  buildServiceChargeDeclaration,
  validateServiceChargeDeclaration,
} from '@/lib/finance/service-charge-declaration';

async function handleGet(_req: Request, _auth: AuthContext) {
  return NextResponse.json({
    success: true,
    template: SERVICE_CHARGE_DECLARATION_TEMPLATE,
    note: 'Declaration is valid only after approval by authorized ALO management — approval happens through MAKER → REVIEWER → APPROVER (payment verification SoD, no self-approval).',
  });
}

async function handlePost(req: Request, auth: AuthContext) {
  try {
    const body = await req.json();

    const declarationText = buildServiceChargeDeclaration({
      studentName: String(body.studentName || '').trim(),
      applicationNumber: String(body.applicationNumber || '').trim(),
      university: String(body.university || '').trim(),
      course: String(body.course || '').trim(),
      intake: String(body.intake || '').trim(),
      serviceChargePolicy: body.serviceChargePolicy === 'STANDARD_SERVICE_CHARGE' ? 'STANDARD_SERVICE_CHARGE' : 'NO_SERVICE_CHARGE',
      managementApproverName: String(body.managementApproverName || '').trim(),
      date: new Date().toISOString(),
    });

    const validation = validateServiceChargeDeclaration(declarationText);
    if (!validation.ok) {
      return NextResponse.json({ success: false, code: 'DECLARATION_INVALID', issues: validation.issues }, { status: 400 });
    }

    // Record as an INTERNAL student comment (never student-chat) when possible
    const internalNote = `OFFICIAL DECLARATION ISSUED (${/\n/.test(declarationText) ? declarationText.split('\n').at(-1) : 'ALO-DECL'})`;
    await db.$executeRawUnsafe(
      "INSERT INTO applicationcomments (id, text, \"applicationId\", \"authorId\", \"authorType\", visibility, \"createdAt\") SELECT ?, ?, a.id, ?, 'STAFF', 'internal', NOW(6) FROM applications a WHERE a.\"serialNumber\" = ? LIMIT 1",
      `decl_${Date.now()}`, declarationText, auth.userId, String(body.applicationNumber || ''),
    ).catch(() => null);

    await db.auditLog.create({
      data: {
        action: 'SERVICE_DECLARATION_GENERATED',
        resource: 'application',
        resourceId: String(body.applicationNumber || 'unknown'),
        userId: auth.userId,
        actorRole: auth.roles?.[0] || 'staff',
        details: internalNote,
      },
    }).catch(() => null);

    return NextResponse.json({ success: true, declaration: declarationText, validated: true, pendingManagementApproval: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to generate declaration' }, { status: 500 });
  }
}

export const GET = withAuth(handleGet, { requireUserTypes: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COUNSELOR', 'FINANCE'] });
export const POST = withAuth(handlePost, { requireUserTypes: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FINANCE'] });
