import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth-middleware";

const STAFF_ROLES = new Set([
  "SUPER_ADMIN", "ADMIN", "super_admin", "admin",
  "COUNSELOR", "counselor", "APPLICATION_TEAM", "application_team",
  "VISA_OFFICER", "visa_officer",
]);

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!auth.roles.some((role) => STAFF_ROLES.has(role)) && !STAFF_ROLES.has(auth.userType)) {
    return NextResponse.json({ error: "Insufficient role permissions" }, { status: 403 });
  }

  const sessions = await db.interviewSession.findMany({
    include: { student: true },
    orderBy: { startedAt: "desc" },
  });
  return NextResponse.json({ sessions });
}
