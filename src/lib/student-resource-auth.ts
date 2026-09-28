import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateUnified } from "@/lib/unified-auth";

/**
 * Shared IDOR-prevention helper for `/api/student/*` resource routes
 * (appointments, sop, notifications, referrals, cv, visa-readiness,
 * next-action, ...).
 *
 * SECURITY FIX (2026-09-28): these routes previously took `studentId`
 * straight from the query string with NO authentication at all — any
 * anonymous caller could read (and in some routes write) any student's
 * appointments, SOP/CV drafts, notifications, referral data or visa
 * readiness checklist simply by supplying an id. This mirrors the fix
 * already applied to `/api/student/profile` (see the SEC-G comment
 * there): reuses the SAME `authenticateUnified` session helper used
 * across the rest of the app (no new auth system), resolves the
 * caller's own student id from their verified session, and only allows
 * a staff (portal) caller to act on a different student's data if they
 * are privileged (admin/super admin) or that student's assigned
 * counselor.
 */
export async function resolveStudentAccess(
  req: NextRequest,
  requestedStudentId: string | null
): Promise<{ studentId: string } | NextResponse> {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;

  if (authRes.type === "student") {
    if (requestedStudentId && requestedStudentId !== authRes.data.studentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return { studentId: authRes.data.studentId };
  }

  // Staff/portal caller — must explicitly supply a studentId and either be
  // privileged or the assigned counselor for that student.
  if (!requestedStudentId) {
    return NextResponse.json({ error: "studentId required" }, { status: 400 });
  }

  const roles = authRes.data.roles ?? [];
  const isPrivileged =
    authRes.data.userType === "SUPER_ADMIN" ||
    authRes.data.userType === "ADMIN" ||
    roles.some((r) => ["super_admin", "admin", "SUPER_ADMIN", "ADMIN", "counselor", "hr_manager"].includes(r));

  if (!isPrivileged) {
    const student = await db.student.findUnique({
      where: { id: requestedStudentId },
      select: { counselorId: true },
    });
    if (!student || student.counselorId !== authRes.data.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return { studentId: requestedStudentId };
}
