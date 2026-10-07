// ============================================================================
// ALO Employee lifecycle — account status state machine + deactivation plan.
// Pure functions, no db access — fully unit-testable.
//
// Spec: ACCOUNT STATUS (12 statuses, history never deleted), EMPLOYEE
// DEACTIVATION (9 revocations) + WORK REASSIGNMENT (nothing silently lost).
// ============================================================================

export const EMPLOYEE_ACCOUNT_STATUSES = [
  "INVITED", "PENDING_ACTIVATION", "PENDING_PROFILE", "PROFILE_SUBMITTED",
  "UNDER_REVIEW", "CORRECTION_REQUIRED", "APPROVED", "ACTIVE",
  "SUSPENDED", "INACTIVE", "TERMINATED", "REJECTED",
] as const;
export type EmployeeAccountStatus = (typeof EMPLOYEE_ACCOUNT_STATUSES)[number];

export const EMPLOYEE_PROFILE_STATUSES = [
  "Incomplete", "Submitted", "Under Review", "Approved",
  "Correction Required", "Suspended", "Inactive", "Terminated",
] as const;

/** TERMINATED and REJECTED are final — history is preserved, never revived implicitly. */
const FINAL_STATUSES = new Set(["TERMINATED", "REJECTED"]);

const ALLOWED_ACCOUNT_TRANSITIONS: Record<string, string[]> = {
  INVITED: ["PENDING_ACTIVATION", "REJECTED"],
  PENDING_ACTIVATION: ["ACTIVE", "PENDING_PROFILE", "REJECTED", "SUSPENDED"],
  PENDING_PROFILE: ["PROFILE_SUBMITTED", "CORRECTION_REQUIRED", "SUSPENDED", "INACTIVE"],
  PROFILE_SUBMITTED: ["UNDER_REVIEW", "CORRECTION_REQUIRED"],
  UNDER_REVIEW: ["APPROVED", "CORRECTION_REQUIRED", "REJECTED"],
  CORRECTION_REQUIRED: ["PROFILE_SUBMITTED", "UNDER_REVIEW"],
  APPROVED: ["ACTIVE", "SUSPENDED"],
  ACTIVE: ["SUSPENDED", "INACTIVE", "TERMINATED"],
  SUSPENDED: ["ACTIVE", "INACTIVE", "TERMINATED"],
  INACTIVE: ["ACTIVE", "TERMINATED"],
  TERMINATED: [],
  REJECTED: [],
};

export function normalizeAccountStatus(s: string): string {
  const up = String(s || "").trim().toUpperCase();
  return (EMPLOYEE_ACCOUNT_STATUSES as readonly string[]).includes(up) ? up : "";
}

export function canTransitionAccount(from: string, to: string): { allowed: boolean; reason?: string } {
  const f = normalizeAccountStatus(from) || String(from || "").toUpperCase();
  const t = normalizeAccountStatus(to);
  if (!t) return { allowed: false, reason: `Unknown status '${to}' — must be one of: ${EMPLOYEE_ACCOUNT_STATUSES.join(", ")}` };
  if (FINAL_STATUSES.has(f)) return { allowed: false, reason: `${f} is final — employee history is preserved and never rewritten` };
  const allowed = ALLOWED_ACCOUNT_TRANSITIONS[f];
  if (!allowed) return { allowed: true }; // legacy/free-text statuses: do not block unknown source states
  if (allowed.includes(t)) return { allowed: true };
  return { allowed: false, reason: `Invalid transition ${f} → ${t}. Allowed next states: ${allowed.join(", ") || "(none — final)"}` };
}

/** Spec: EMPLOYEE DEACTIVATION — the nine revocations. */
export const DEACTIVATION_REVOCATIONS = [
  "login", "sessions", "api_tokens", "whatsapp_access", "social_access",
  "email_integration_access", "temporary_permissions", "ai_permissions", "device_access",
] as const;

/** Spec: everything preserved (soft state, never hard deletion). */
export const PRESERVED_HISTORIES = [
  "student_history", "application_history", "document_history",
  "communication_history", "approval_history", "audit_history",
] as const;

/** Spec: WORK REASSIGNMENT — everything that must be identified before exit. */
export const REASSIGNABLE_ENTITY_TYPES = [
  "student", "application", "document", "task", "message",
  "whatsapp_conversation", "pending_approval", "follow_up", "escalation",
] as const;

export function buildDeactivationPlan(employeeId: string, currentStatus: string, reason: string):
  { ok: true; newStatus: "TERMINATED"; revocations: string[]; reassignmentEntityTypes: string[]; preservedHistories: string[] }
  | { ok: false; error: string } {
  if (!employeeId) return { ok: false, error: "employeeId required" };
  if (!reason || reason.trim().length < 10) return { ok: false, error: "A deactivation reason (min 10 chars) is required — every deactivation is audited" };
  const check = canTransitionAccount(currentStatus, "TERMINATED");
  if (!check.allowed) return { ok: false, error: check.reason! };
  return {
    ok: true,
    newStatus: "TERMINATED",
    revocations: [...DEACTIVATION_REVOCATIONS],
    reassignmentEntityTypes: [...REASSIGNABLE_ENTITY_TYPES],
    preservedHistories: [...PRESERVED_HISTORIES],
  };
}
