// ============================================================================
// ALO Notification Engine — employee/HR event catalog + leak-safe builders.
// Pure functions, no db. Spec: NOTIFICATION ENGINE (21 events) + NOTIFICATION
// RULES (Super Admin / Partner Super Admin) + "Do not expose sensitive
// information in notifications."
// ============================================================================

/** The 21 employee-lifecycle notification events from the spec. */
export const EMPLOYEE_NOTIFICATION_EVENTS = [
  "employee_joining", "profile_submission", "correction_required", "confirmation",
  "increment", "promotion", "document_expiry", "passport_expiry", "visa_expiry",
  "contract_expiry", "birthday", "work_anniversary", "payroll_ready", "salary_paid",
  "leave_request", "leave_approval", "sla_breach", "permission_request",
  "permission_approval", "permission_rejection", "security_alert",
] as const;
export type EmployeeNotificationEvent = (typeof EMPLOYEE_NOTIFICATION_EVENTS)[number];

/** Super Admin is notified about these (spec: NOTIFICATION RULES). */
export const SUPER_ADMIN_NOTIFY_RULES = [
  "employee_profile_submitted", "employee_permission_request", "sensitive_profile_accessed",
  "salary_accessed", "document_accessed", "partner_extra_seat_request",
  "partner_extra_quota_request", "quota_exceeded", "restricted_feature_attempt",
  "security_alert", "repeated_sla_breach",
] as const;

/** Partner Super Admin is notified about these (spec: NOTIFICATION RULES). */
export const PARTNER_SUPER_ADMIN_NOTIFY_RULES = [
  "quota_near_limit", "quota_finished", "extra_quota_approved", "extra_quota_rejected",
  "student_benefit_activated", "voucher_generated", "application_submitted", "application_approved",
] as const;

/**
 * NEVER put these into a notification — privacy rule with a concrete example:
 * "Your employee profile requires correction." NOT "Your NID and salary
 * information are incorrect."
 */
export const NOTIFICATION_SENSITIVE_KEYS = [
  "salary", "bank_account", "bank_number", "nid", "tin", "passport_number",
  "tax", "provident_fund", "emergency_contact", "personal_address",
] as const;

const SENSITIVE_PATTERN = /salary|bank\s?acc|nid|tin\b|passport|tax|provident|emergency_contact|personal_address|amount\b|\b\d{6,}\b/i;

/** Allowlisted, leak-safe messages for each event (no record-specific secrets). */
const SAFE_MESSAGES: Record<EmployeeNotificationEvent, (ctx: { name?: string; count?: number }) => string> = {
  employee_joining: (c) => `New employee joined${c.name ? `: ${c.name}` : ""} — profile pending.`,
  profile_submission: () => "An employee profile has been submitted for review.",
  correction_required: () => "Your employee profile requires correction. Please review and resubmit.",
  confirmation: (c) => `Employment confirmation processed${c.name ? ` for ${c.name}` : ""}.`,
  increment: (c) => `An increment letter has been issued${c.name ? ` for ${c.name}` : ""}.`,
  promotion: (c) => `A promotion letter has been issued${c.name ? ` for ${c.name}` : ""}.`,
  document_expiry: () => "One or more employee documents are approaching expiry. Please review the document center.",
  passport_expiry: () => "A passport document is approaching expiry. Please review the document center.",
  visa_expiry: () => "A visa-related document is approaching expiry. Please review promptly.",
  contract_expiry: () => "An employment contract is approaching expiry.",
  birthday: (c) => `Happy birthday${c.name ? `, ${c.name}` : ""}!`,
  work_anniversary: (c) => `Happy work anniversary${c.name ? `, ${c.name}` : ""}!`,
  payroll_ready: () => "Monthly payroll is ready for review.",
  salary_paid: () => "Your salary for this period has been processed. Your payslip is available in your portal.",
  leave_request: (c) => `A leave request is awaiting review${c.count ? ` (${c.count} pending)` : ""}.`,
  leave_approval: () => "Your leave request has been reviewed. Check your portal for the decision.",
  sla_breach: () => "A communication conversation has breached its SLA and needs attention.",
  permission_request: () => "An employee permission request is awaiting review.",
  permission_approval: () => "Your permission request has been approved (temporary access, auto-expiry applies).",
  permission_rejection: () => "Your permission request has been reviewed and was not approved. Contact your manager for details.",
  security_alert: () => "A security event was recorded on an account you supervise. Review the security log.",
};

export function isEmployeeNotificationEvent(v: string): v is EmployeeNotificationEvent {
  return (EMPLOYEE_NOTIFICATION_EVENTS as readonly string[]).includes(v);
}

/** Build a leak-safe notification message; reject anything that smuggles secrets. */
export function buildSafeEmployeeNotification(
  event: string,
  ctx: { name?: string; count?: number } = {},
): { ok: true; message: string } | { ok: false; error: string } {
  if (!isEmployeeNotificationEvent(event)) {
    return { ok: false, error: `Unknown notification event '${event}' — must be one of the ${EMPLOYEE_NOTIFICATION_EVENTS.length} cataloged events` };
  }
  const message = SAFE_MESSAGES[event](ctx);
  if (SENSITIVE_PATTERN.test(message)) {
    return { ok: false, error: "Notification blocked — message contains sensitive information (spec: never expose salary/NID/bank/private data in notifications)" };
  }
  return { ok: true, message };
}

/** Guard for channel-blind callers: verify an arbitrary message is leak-safe. */
export function isNotificationLeakSafe(message: string): boolean {
  return !SENSITIVE_PATTERN.test(String(message || ""));
}
