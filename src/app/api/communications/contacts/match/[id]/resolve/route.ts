import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest, logAuditAction } from "@/lib/auth-middleware";

export const dynamic = "force-dynamic";

// ============================================================================
// POST /api/communications/contacts/match/[id]/resolve
//
// §126 — Contact Identity Verifier decisions. Every decision requires an
// authenticated, AUTHORIZED ROLE; CREATE_NEW additionally requires an
// admin-level role because it provisions a brand-new record. The decision,
// decidedBy and timestamp are recorded and audit-logged.
// ============================================================================

const DECISIONS = ["OPEN_EXISTING", "MERGE_REQUEST", "CREATE_NEW"] as const;

// Roles allowed to resolve any pending contact match review.
const RESOLVER_ROLES = new Set([
  "SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "DEPARTMENT_MANAGER",
  "COUNSELOR", "MARKETING_MANAGER",
]);
// CREATE_NEW provisions a new record — elevated roles only (Authorized Role).
const CREATE_NEW_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "DEPARTMENT_MANAGER"]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;

    const primaryRole = String(auth.roles?.[0] || auth.userType || "").toUpperCase();
    if (!RESOLVER_ROLES.has(primaryRole)) {
      return NextResponse.json({ error: "Forbidden — authorized role required to resolve contact matches" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { decision } = body;

    if (!decision || !DECISIONS.includes(decision)) {
      return NextResponse.json({ error: "decision must be OPEN_EXISTING, MERGE_REQUEST, or CREATE_NEW" }, { status: 400 });
    }

    // §126 — CREATE_NEW is a privileged action (Authorized Role Only).
    if (decision === "CREATE_NEW" && !CREATE_NEW_ROLES.has(primaryRole)) {
      return NextResponse.json(
        { error: "Forbidden — CREATE_NEW requires an admin-level role (Authorized Role Only)" },
        { status: 403 },
      );
    }

    const existing = await db.contactMatchReview.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "ContactMatchReview not found" }, { status: 404 });
    }
    if (existing.status !== "PENDING") {
      return NextResponse.json(
        { error: `Review already resolved (status: ${existing.status}) — decisions are final and auditable` },
        { status: 409 },
      );
    }

    const statusMap: Record<string, string> = {
      OPEN_EXISTING: "RESOLVED_LINKED",
      MERGE_REQUEST: "RESOLVED_MERGED",
      CREATE_NEW: "RESOLVED_NEW",
    };

    const updated = await db.contactMatchReview.update({
      where: { id },
      data: {
        decision,
        decidedBy: auth.userId, // recorded from the authenticated principal — never trusted from the client
        decidedAt: new Date(),
        status: statusMap[decision],
      },
    });

    await logAuditAction(auth, "CONTACT_MATCH_RESOLVED", "ContactMatchReview", id, {
      decision,
      previousStatus: existing.status,
      newStatus: statusMap[decision],
      decidedBy: auth.userId,
      role: primaryRole,
    }).catch(() => {});

    return NextResponse.json({ review: updated, resolved: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to resolve review" }, { status: 500 });
  }
}
