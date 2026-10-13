import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ─── ALO Employee Access Control Engine ─────────────────────
// Backend helpers for permission checking — MUST be used by every controller.
// Do NOT rely on frontend hiding.

// ─── Auth Types ─────────────────────────────────────────────

type AuthResult =
  | { success: true; user: { id: string; email: string; name: string; role: string; status: string } }
  | NextResponse;

type ErrorResponse = NextResponse;

/**
 * Type guard to check if an auth result is an error response.
 * Usage: const auth = await requireAuth(req); if (isErrorResponse(auth)) return auth;
 */
export function isErrorResponse(result: AuthResult | ErrorResponse): result is ErrorResponse {
  return result instanceof NextResponse;
}

/**
 * Require authentication. Returns user info or a 401 response.
 */
export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required. Please sign in." },
        { status: 401 }
      );
    }
    const user = session.user as any;
    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Account is not active." },
        { status: 403 }
      );
    }
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    };
  } catch {
    return NextResponse.json(
      { success: false, error: "Authentication check failed." },
      { status: 500 }
    );
  }
}

/**
 * Require a specific permission (feature key). Returns user info or error.
 * SUPER_ADMIN and ADMIN roles bypass permission checks.
 */
export async function requirePermission(req: NextRequest, permissionKey: string): Promise<AuthResult> {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  // SUPER_ADMIN and ADMIN bypass permission checks
  if (auth.user.role === "SUPER_ADMIN" || auth.user.role === "ADMIN") {
    return auth;
  }

  // Check feature access via employee record
  const employee = await db.employeeHR.findFirst({ where: { userId: auth.user.id } });
  if (!employee) {
    return NextResponse.json(
      { success: false, error: "No employee record found. Permission denied." },
      { status: 403 }
    );
  }

  // Chairman/CEO always have access
  if (employee.designation === "Chairman" || employee.designation === "CEO") {
    return auth;
  }

  const rule = await db.featureAccessRule.findUnique({
    where: {
      ownerType_ownerId_featureKey: { ownerType: "EMPLOYEE", ownerId: employee.id, featureKey: permissionKey },
    },
  });

  if (!rule || !rule.isEnabled) {
    return NextResponse.json(
      { success: false, error: `Permission denied: ${permissionKey}` },
      { status: 403 }
    );
  }

  return auth;
}

/**
 * Log an audit event. Fire-and-forget.
 */
export async function auditLog(params: {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        details: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress,
      },
    });
  } catch {
    // Audit logging should never break the main flow
  }
}

/**
 * Parse pagination params from request URL search params.
 */
export function parsePagination(searchParams: URLSearchParams, defaultLimit = 20) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || String(defaultLimit), 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

/**
 * Check if a user/employee can access a specific feature.
 * Super Admin and Chairman always have access.
 */
export async function canAccessFeature(ownerId: string, featureKey: string): Promise<boolean> {
  // Get the employee
  const employee = await db.employeeHR.findFirst({ where: { id: ownerId } });
  if (!employee) return false;

  // Super Admin and Chairman always have access
  if (employee.designation === "Chairman" || employee.designation === "CEO" || employee.role === "SUPER_ADMIN") {
    return true;
  }

  // Check feature access rule
  const rule = await db.featureAccessRule.findUnique({
    where: {
      ownerType_ownerId_featureKey: { ownerType: "EMPLOYEE", ownerId, featureKey },
    },
  });

  if (!rule) return false;
  return rule.isEnabled;
}

/**
 * Get the quota limit for a feature (e.g. monthly image limit).
 */
export async function getQuota(ownerType: string, ownerId: string, featureKey: string): Promise<number | null> {
  const rule = await db.featureAccessRule.findUnique({
    where: {
      ownerType_ownerId_featureKey: { ownerType, ownerId, featureKey },
    },
  });
  return rule?.limitValue ?? null;
}

/**
 * Check quota before performing an action. Returns remaining quota.
 */
export async function checkQuotaBeforeAction(ownerType: string, ownerId: string, featureKey: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const limit = await getQuota(ownerType, ownerId, featureKey);
  if (limit === null) {
    // No limit set — check if feature is enabled
    const canAccess = await canAccessFeature(ownerId, featureKey);
    return { allowed: canAccess, remaining: canAccess ? Infinity : 0, limit: 0 };
  }

  // Count usage this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const usageCount = await db.featureUsageLog.count({
    where: {
      ownerType,
      ownerId,
      featureKey,
      createdAt: { gte: monthStart },
    },
  });

  const remaining = Math.max(0, limit - usageCount);
  return { allowed: remaining > 0, remaining, limit };
}

/**
 * Record usage of a feature (e.g. image generated, video generated, mock voucher used).
 */
export async function recordUsage(ownerType: string, ownerId: string, featureKey: string, action: string, metadata?: any): Promise<void> {
  await db.featureUsageLog.create({
    data: {
      ownerType,
      ownerId,
      featureKey,
      action,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

/**
 * Check if a viewer can see an employee's private profile.
 * Only: Employee themself, Super Admin, Chairman, HR Manager with permission.
 */
export async function canViewEmployeePrivateProfile(viewerId: string, employeeId: string): Promise<boolean> {
  // Self
  if (viewerId === employeeId) return true;

  const viewer = await db.employeeHR.findFirst({ where: { id: viewerId } });
  if (!viewer) return false;

  // Super Admin and Chairman always can
  if (viewer.designation === "Chairman" || viewer.designation === "CEO" || viewer.role === "SUPER_ADMIN") {
    return true;
  }

  // HR Manager with permission
  if (viewer.designation === "HR Manager") {
    return canAccessFeature(viewerId, "employee.profile.view_private");
  }

  return false;
}

/**
 * Check if a user can view B2B partner details for a specific application.
 */
export async function canViewB2BDetails(userId: string, applicationId: string): Promise<boolean> {
  const employee = await db.employeeHR.findFirst({ where: { id: userId } });
  if (!employee) return false;

  if (employee.role === "SUPER_ADMIN" || employee.designation === "Chairman") return true;

  // Application team and Finance can view B2B details
  if (employee.designation === "Application Manager" || employee.designation === "Application Team" || employee.role === "APPLICATION_TEAM") {
    return canAccessFeature(userId, "partner.b2b.view");
  }

  if (employee.role === "FINANCE") {
    return canAccessFeature(userId, "partner.b2b.view");
  }

  return false;
}

/**
 * Check if a partner student can use a specific benefit (mock test, interview prep).
 * Eligible partner students get: 3 English mock vouchers + 1 interview prep.
 * Student benefits only after ALO application.
 */
export async function canUseStudentBenefit(studentId: string, benefitType: "ENGLISH_MOCK" | "INTERVIEW_PREP"): Promise<{ allowed: boolean; remaining: number; reason?: string }> {
  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return { allowed: false, remaining: 0, reason: "Student not found" };

  // Check if student has an ALO application (benefit requires ALO application)
  const applications = await db.application.findMany({ where: { studentId } });
  if (applications.length === 0) {
    return { allowed: false, remaining: 0, reason: "Student benefits require an ALO application first" };
  }

  // Check partner package limits
  if (student.partnerId) {
    const partnerEmp = await db.employeeHR.findFirst({ where: { userId: student.partnerId } });
    if (partnerEmp) {
      const assignment = await db.partnerPackageAssignment.findFirst({
        where: { partnerId: partnerEmp.id, status: "ACTIVE" },
        include: { package: true },
      });
      if (assignment) {
        const limit = benefitType === "ENGLISH_MOCK" ? assignment.package.englishMockVoucherLimit : assignment.package.interviewPrepLimit;
        // Count usage for this student
        const usageCount = await db.featureUsageLog.count({
          where: {
            ownerType: "PARTNER",
            ownerId: partnerEmp.id,
            featureKey: benefitType === "ENGLISH_MOCK" ? "partner.student.benefit" : "partner.student.benefit",
            action: benefitType === "ENGLISH_MOCK" ? "mock_voucher_used" : "interview_prep_used",
            metadata: { contains: studentId },
          },
        });
        const remaining = Math.max(0, limit - usageCount);
        if (remaining === 0) {
          return { allowed: false, remaining: 0, reason: `${benefitType} voucher limit reached (${limit})` };
        }
        return { allowed: true, remaining };
      }
    }
  }

  // Non-partner ALO students: 3 free mocks + 1 interview (standard ALO policy)
  const mockCount = await db.mockTest.count({ where: { studentId, isFree: true } });
  if (benefitType === "ENGLISH_MOCK") {
    const remaining = Math.max(0, 3 - mockCount);
    if (remaining === 0) return { allowed: false, remaining: 0, reason: "Free mock limit reached (3). Payment required for additional mocks." };
    return { allowed: true, remaining };
  }

  if (benefitType === "INTERVIEW_PREP") {
    const interviewCount = await db.interviewSession.count({ where: { studentId } });
    if (interviewCount >= 1) return { allowed: false, remaining: 0, reason: "Free interview prep already used (1)." };
    return { allowed: true, remaining: 1 - interviewCount };
  }

  return { allowed: false, remaining: 0, reason: "Unknown benefit type" };
}

/**
 * Log sensitive data access (salary view, document download, etc.)
 */
export async function logSensitiveAccess(userId: string, action: string, resource: string, resourceId: string): Promise<void> {
  await db.auditLog.create({
    data: {
      userId,
      action: action as any,
      resource,
      resourceId,
      details: JSON.stringify({ timestamp: new Date().toISOString() }),
      ipAddress: "server-side",
    },
  });
}

/**
 * Get partner package for a partner employee
 */
export async function getPartnerPackage(partnerEmployeeId: string) {
  const assignment = await db.partnerPackageAssignment.findFirst({
    where: { partnerId: partnerEmployeeId, status: "ACTIVE" },
    include: { package: true },
  });
  return assignment?.package || null;
}

/**
 * Get all feature keys with descriptions (for the permission panel UI)
 */
export const FEATURE_DEFINITIONS = [
  { key: "employee.profile.view", description: "View employee profiles", module: "Employee", requiresApproval: false },
  { key: "employee.profile.view_private", description: "View employee private profile (salary, NID, bank)", module: "Employee", requiresApproval: true },
  { key: "employee.salary.view", description: "View employee salary details", module: "Employee", requiresApproval: true },
  { key: "employee.salary.manage", description: "Manage employee salary", module: "Employee", requiresApproval: true },
  { key: "employee.create", description: "Create new employee accounts", module: "Employee", requiresApproval: false },
  { key: "employee.activate", description: "Activate/resend activation emails", module: "Employee", requiresApproval: false },
  { key: "employee.suspend", description: "Suspend employee accounts", module: "Employee", requiresApproval: true },
  { key: "employee.documents.view", description: "View employee documents", module: "Employee", requiresApproval: false },
  { key: "employee.documents.download", description: "Download employee documents", module: "Employee", requiresApproval: true },
  { key: "employee.attendance.view", description: "View employee attendance", module: "Employee", requiresApproval: false },
  { key: "employee.attendance.manage", description: "Manage employee attendance", module: "Employee", requiresApproval: false },
  { key: "employee.leave.approve", description: "Approve leave requests", module: "Employee", requiresApproval: false },
  { key: "employee.profile.approve", description: "Approve employee profiles (HR review)", module: "Employee", requiresApproval: false },
  { key: "partner.users.manage", description: "Manage partner users", module: "Partner", requiresApproval: false },
  { key: "partner.package.assign", description: "Assign partner packages", module: "Partner", requiresApproval: false },
  { key: "partner.quota.approve", description: "Approve extra quota requests", module: "Partner", requiresApproval: false },
  { key: "partner.student.benefit", description: "Partner student benefits (mock/interview)", module: "Partner", requiresApproval: false },
  { key: "partner.b2b.view", description: "View B2B partner details", module: "Partner", requiresApproval: false },
  { key: "marketing.image.generate", description: "Generate marketing images", module: "Marketing", requiresApproval: false },
  { key: "marketing.video.generate", description: "Generate marketing videos", module: "Marketing", requiresApproval: false },
  { key: "marketing.auto_post", description: "Auto-post to social media", module: "Marketing", requiresApproval: true },
  { key: "marketing.content.approve", description: "Approve AI-generated content", module: "Marketing", requiresApproval: false },
  { key: "communication.whatsapp.send", description: "Send WhatsApp messages", module: "Communication", requiresApproval: false },
  { key: "communication.sms.send", description: "Send SMS", module: "Communication", requiresApproval: false },
  { key: "communication.email.send", description: "Send emails", module: "Communication", requiresApproval: false },
  { key: "system.rbac.manage", description: "Manage role-based access control", module: "System", requiresApproval: false },
  { key: "system.audit.view", description: "View audit logs", module: "System", requiresApproval: false },
  { key: "system.import.manage", description: "Manage data imports", module: "System", requiresApproval: false },
  { key: "system.publish.approve", description: "Approve public data publishing", module: "System", requiresApproval: false },
];
