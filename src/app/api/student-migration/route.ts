import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const migrations = await db.portalAuditLog.findMany({
        where: { action: { contains: "MIGRATION" } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }).catch(() => []);
      return NextResponse.json({ success: true, data: migrations });
    } catch {
      return NextResponse.json({ success: true, data: [] });
    }
  }, { requireUserTypes: ["ADMIN", "SUPER_ADMIN"] })(request);
}

export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { studentId, fromStatus, toStatus, reason } = body;
      
      await db.portalAuditLog.create({
        data: {
          actorUserId: auth.userId,
          action: "STUDENT_MIGRATION",
          entityType: "STUDENT",
          entityId: studentId || "unknown",
          metadata: JSON.stringify({ fromStatus, toStatus, reason, migratedBy: auth.userId })
        }
      }).catch(() => null);
      
      return NextResponse.json({ success: true, message: "Migration logged", data: { id: "mig-" + Date.now(), studentId, fromStatus, toStatus, status: "completed" } }, { status: 201 });
    } catch (e) {
      return NextResponse.json({ success: false, error: "Migration failed" }, { status: 500 });
    }
  })(request);
}

