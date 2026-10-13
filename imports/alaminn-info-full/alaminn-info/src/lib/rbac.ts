/**
 * RBAC — Role-Based Access Control
 * --------------------------------
 * Server-side, source-of-truth permission matrix for the Alaminn.info
 * Command Center. Frontend role state is NEVER trusted — every API
 * route must call `requirePermission()` (or `requireRole()`) to
 * validate the signed session cookie before any privileged action.
 *
 * The 11 roles below mirror the spec §25 permission matrix.
 *
 * SECURITY: This file is the single source of truth. Do not duplicate
 * role logic on the client.
 */

export type UserRole =
  | "SUPER_ADMIN"
  | "OWNER"
  | "EXECUTIVE_ASSISTANT"
  | "CRM_MANAGER"
  | "PARTNERSHIP_MANAGER"
  | "CONTENT_MANAGER"
  | "MARKETING_MANAGER"
  | "PROJECT_MANAGER"
  | "AI_REVIEWER"
  | "SECURITY_AUDITOR"
  | "VIEWER";

export const ALL_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "OWNER",
  "EXECUTIVE_ASSISTANT",
  "CRM_MANAGER",
  "PARTNERSHIP_MANAGER",
  "CONTENT_MANAGER",
  "MARKETING_MANAGER",
  "PROJECT_MANAGER",
  "AI_REVIEWER",
  "SECURITY_AUDITOR",
  "VIEWER",
];

/**
 * Permission strings are namespaced `<resource>.<action>`.
 * A role either has a permission or it does not — there is no
 * "conditional" grant. Bulk actions use the same permission as
 * their singular counterpart.
 */
export type Permission =
  // Dashboard / overview
  | "dashboard.view"
  // CRM
  | "contacts.view"
  | "contacts.create"
  | "contacts.update"
  | "contacts.delete"
  | "contacts.export"
  | "inquiries.view"
  | "inquiries.create"
  | "inquiries.update"
  | "inquiries.delete"
  | "inquiries.export"
  | "opportunities.view"
  | "opportunities.create"
  | "opportunities.update"
  | "opportunities.delete"
  | "opportunities.export"
  // Meetings
  | "meetings.view"
  | "meetings.update"
  | "meetings.delete"
  // AI Workspace
  | "ai_tasks.view"
  | "ai_tasks.create"
  | "ai_tasks.update"
  | "ai_tasks.delete"
  | "ai_approvals.view"
  | "ai_approvals.decide" // approve / reject / request-revision
  // Content
  | "articles.view"
  | "articles.create"
  | "articles.update"
  | "articles.publish"
  | "articles.delete"
  | "resources.view"
  | "resources.create"
  | "resources.update"
  | "resources.delete"
  | "projects.view"
  | "projects.create"
  | "projects.update"
  | "projects.delete"
  | "case_studies.view"
  | "case_studies.create"
  | "case_studies.update"
  | "case_studies.delete"
  | "impact_records.view"
  | "impact_records.create"
  | "impact_records.update"
  | "impact_records.delete"
  // Newsletter
  | "newsletter.view"
  | "newsletter.export"
  | "newsletter.send"
  // Partnerships / referrals
  | "partnerships.view"
  | "partnerships.update"
  | "student_referrals.view"
  | "student_referrals.update"
  // Audit & security
  | "audit_logs.view"
  | "audit_logs.export"
  | "security_settings.view"
  | "security_settings.update"
  | "integration_settings.view"
  | "integration_settings.update"
  // User management
  | "users.view"
  | "users.create"
  | "users.update"
  | "users.delete"
  | "users.role_assign" // changing another user's role
  // ─── Higher Study platform ──────────────────────────────────────────
  | "higher-study.dashboard.view"
  | "higher-study.universities.view"
  | "higher-study.universities.create"
  | "higher-study.universities.update"
  | "higher-study.universities.delete"
  | "higher-study.universities.verify"
  | "higher-study.universities.publish"
  | "higher-study.courses.view"
  | "higher-study.courses.create"
  | "higher-study.courses.update"
  | "higher-study.courses.delete"
  | "higher-study.courses.verify"
  | "higher-study.courses.publish"
  | "higher-study.scholarships.view"
  | "higher-study.scholarships.create"
  | "higher-study.scholarships.update"
  | "higher-study.scholarships.delete"
  | "higher-study.scholarships.verify"
  | "higher-study.scholarships.publish"
  | "higher-study.research.view"
  | "higher-study.research.create"
  | "higher-study.research.update"
  | "higher-study.research.delete"
  | "higher-study.research.verify"
  | "higher-study.research.publish"
  | "higher-study.supervisors.view"
  | "higher-study.supervisors.create"
  | "higher-study.supervisors.update"
  | "higher-study.supervisors.delete"
  | "higher-study.supervisors.verify"
  | "higher-study.supervisors.publish"
  | "higher-study.resources.view"
  | "higher-study.resources.create"
  | "higher-study.resources.update"
  | "higher-study.resources.delete"
  | "higher-study.resources.verify"
  | "higher-study.resources.publish"
  | "higher-study.countries.view"
  | "higher-study.countries.create"
  | "higher-study.countries.update"
  | "higher-study.countries.delete"
  | "higher-study.cities.view"
  | "higher-study.cities.create"
  | "higher-study.cities.update"
  | "higher-study.cities.delete"
  | "higher-study.subjects.view"
  | "higher-study.subjects.create"
  | "higher-study.subjects.update"
  | "higher-study.subjects.delete"
  | "higher-study.intakes.view"
  | "higher-study.intakes.create"
  | "higher-study.intakes.update"
  | "higher-study.intakes.delete"
  | "higher-study.events.view"
  | "higher-study.events.create"
  | "higher-study.events.update"
  | "higher-study.events.delete"
  | "higher-study.student-stories.view"
  | "higher-study.student-stories.create"
  | "higher-study.student-stories.update"
  | "higher-study.student-stories.delete"
  | "higher-study.research-areas.view"
  | "higher-study.research-areas.create"
  | "higher-study.research-areas.update"
  | "higher-study.research-areas.delete"
  | "higher-study.import"
  | "higher-study.audit.view"
  | "higher-study.referrals.view"
  // ─── English Learning platform ──────────────────────────────────────
  | "english-learning.dashboard.view"
  | "english-learning.courses.view"
  | "english-learning.courses.create"
  | "english-learning.courses.update"
  | "english-learning.courses.delete"
  | "english-learning.courses.publish"
  | "english-learning.lessons.view"
  | "english-learning.lessons.create"
  | "english-learning.lessons.update"
  | "english-learning.lessons.delete"
  | "english-learning.practice-tests.view"
  | "english-learning.practice-tests.create"
  | "english-learning.practice-tests.update"
  | "english-learning.practice-tests.delete"
  | "english-learning.questions.view"
  | "english-learning.questions.create"
  | "english-learning.questions.update"
  | "english-learning.questions.delete"
  | "english-learning.tutors.view"
  | "english-learning.tutors.create"
  | "english-learning.tutors.update"
  | "english-learning.tutors.delete"
  | "english-learning.resources.view"
  | "english-learning.resources.create"
  | "english-learning.resources.update"
  | "english-learning.resources.delete"
  | "english-learning.audit.view"
  | "english-learning.referrals.view"
  // ─── WhatsApp AI Agent ────────────────────────────────────────────
  | "whatsapp.view"
  | "whatsapp.send"
  | "whatsapp.manage";

/**
 * The matrix. `SUPER_ADMIN` and `OWNER` are intentionally expanded as
 * "all permissions" at runtime (see `rolePermissions`) so the matrix
 * stays maintainable.
 */
const MATRIX: Partial<Record<UserRole, Permission[]>> = {
  EXECUTIVE_ASSISTANT: [
    "dashboard.view",
    "contacts.view",
    "contacts.update",
    "inquiries.view",
    "inquiries.update",
    "opportunities.view",
    "opportunities.update",
    "meetings.view",
    "meetings.update",
    "ai_tasks.view",
    "ai_tasks.create",
    "articles.view",
    "newsletter.view",
  ],
  CRM_MANAGER: [
    "dashboard.view",
    "contacts.view",
    "contacts.create",
    "contacts.update",
    "contacts.export",
    "inquiries.view",
    "inquiries.create",
    "inquiries.update",
    "inquiries.export",
    "opportunities.view",
    "opportunities.create",
    "opportunities.update",
    "opportunities.export",
    "meetings.view",
    "meetings.update",
    "newsletter.view",
    "newsletter.export",
    "whatsapp.view",
    "whatsapp.send",
  ],
  PARTNERSHIP_MANAGER: [
    "dashboard.view",
    "contacts.view",
    "contacts.update",
    "inquiries.view",
    "inquiries.update",
    "opportunities.view",
    "opportunities.update",
    "partnerships.view",
    "partnerships.update",
    "student_referrals.view",
    "student_referrals.update",
    "meetings.view",
    "meetings.update",
  ],
  CONTENT_MANAGER: [
    "dashboard.view",
    "articles.view",
    "articles.create",
    "articles.update",
    "articles.publish",
    "resources.view",
    "resources.create",
    "resources.update",
    "resources.delete",
    "impact_records.view",
    "impact_records.create",
    "impact_records.update",
    "case_studies.view",
    "case_studies.update",
    "newsletter.view",
    "newsletter.send",
  ],
  MARKETING_MANAGER: [
    "dashboard.view",
    "articles.view",
    "articles.update",
    "articles.publish",
    "resources.view",
    "resources.update",
    "projects.view",
    "projects.update",
    "case_studies.view",
    "case_studies.update",
    "impact_records.view",
    "impact_records.update",
    "newsletter.view",
    "newsletter.export",
    "newsletter.send",
  ],
  PROJECT_MANAGER: [
    "dashboard.view",
    "projects.view",
    "projects.create",
    "projects.update",
    "case_studies.view",
    "case_studies.create",
    "case_studies.update",
    "impact_records.view",
    "impact_records.update",
    "contacts.view",
    "inquiries.view",
    "opportunities.view",
    "meetings.view",
    "meetings.update",
  ],
  AI_REVIEWER: [
    "dashboard.view",
    "ai_tasks.view",
    "ai_tasks.update",
    "ai_approvals.view",
    "ai_approvals.decide",
    "articles.view",
    "audit_logs.view",
    "whatsapp.view",
    "whatsapp.send",
    "whatsapp.manage",
  ],
  SECURITY_AUDITOR: [
    "dashboard.view",
    "audit_logs.view",
    "audit_logs.export",
    "security_settings.view",
    "integration_settings.view",
    "users.view",
  ],
  VIEWER: ["dashboard.view"],
};

const ALL_PERMISSIONS: Permission[] = [
  "dashboard.view",
  "contacts.view", "contacts.create", "contacts.update", "contacts.delete", "contacts.export",
  "inquiries.view", "inquiries.create", "inquiries.update", "inquiries.delete", "inquiries.export",
  "opportunities.view", "opportunities.create", "opportunities.update", "opportunities.delete", "opportunities.export",
  "meetings.view", "meetings.update", "meetings.delete",
  "ai_tasks.view", "ai_tasks.create", "ai_tasks.update", "ai_tasks.delete",
  "ai_approvals.view", "ai_approvals.decide",
  "articles.view", "articles.create", "articles.update", "articles.publish", "articles.delete",
  "resources.view", "resources.create", "resources.update", "resources.delete",
  "projects.view", "projects.create", "projects.update", "projects.delete",
  "case_studies.view", "case_studies.create", "case_studies.update", "case_studies.delete",
  "impact_records.view", "impact_records.create", "impact_records.update", "impact_records.delete",
  "newsletter.view", "newsletter.export", "newsletter.send",
  "partnerships.view", "partnerships.update",
  "student_referrals.view", "student_referrals.update",
  "audit_logs.view", "audit_logs.export",
  "security_settings.view", "security_settings.update",
  "integration_settings.view", "integration_settings.update",
  "users.view", "users.create", "users.update", "users.delete", "users.role_assign",
  // Higher Study platform — SUPER_ADMIN + OWNER receive every permission
  // via the rolePermissions() fast path; listing them here so the union
  // type is exhaustive.
  "higher-study.dashboard.view",
  "higher-study.universities.view", "higher-study.universities.create", "higher-study.universities.update", "higher-study.universities.delete", "higher-study.universities.verify", "higher-study.universities.publish",
  "higher-study.courses.view", "higher-study.courses.create", "higher-study.courses.update", "higher-study.courses.delete", "higher-study.courses.verify", "higher-study.courses.publish",
  "higher-study.scholarships.view", "higher-study.scholarships.create", "higher-study.scholarships.update", "higher-study.scholarships.delete", "higher-study.scholarships.verify", "higher-study.scholarships.publish",
  "higher-study.research.view", "higher-study.research.create", "higher-study.research.update", "higher-study.research.delete", "higher-study.research.verify", "higher-study.research.publish",
  "higher-study.supervisors.view", "higher-study.supervisors.create", "higher-study.supervisors.update", "higher-study.supervisors.delete", "higher-study.supervisors.verify", "higher-study.supervisors.publish",
  "higher-study.resources.view", "higher-study.resources.create", "higher-study.resources.update", "higher-study.resources.delete", "higher-study.resources.verify", "higher-study.resources.publish",
  "higher-study.countries.view", "higher-study.countries.create", "higher-study.countries.update", "higher-study.countries.delete",
  "higher-study.cities.view", "higher-study.cities.create", "higher-study.cities.update", "higher-study.cities.delete",
  "higher-study.subjects.view", "higher-study.subjects.create", "higher-study.subjects.update", "higher-study.subjects.delete",
  "higher-study.intakes.view", "higher-study.intakes.create", "higher-study.intakes.update", "higher-study.intakes.delete",
  "higher-study.events.view", "higher-study.events.create", "higher-study.events.update", "higher-study.events.delete",
  "higher-study.student-stories.view", "higher-study.student-stories.create", "higher-study.student-stories.update", "higher-study.student-stories.delete",
  "higher-study.research-areas.view", "higher-study.research-areas.create", "higher-study.research-areas.update", "higher-study.research-areas.delete",
  "higher-study.import", "higher-study.audit.view", "higher-study.referrals.view",
  // English Learning platform — SUPER_ADMIN + OWNER receive every permission
  // via the rolePermissions() fast path; listing them here so the union
  // type is exhaustive.
  "english-learning.dashboard.view",
  "english-learning.courses.view", "english-learning.courses.create", "english-learning.courses.update", "english-learning.courses.delete", "english-learning.courses.publish",
  "english-learning.lessons.view", "english-learning.lessons.create", "english-learning.lessons.update", "english-learning.lessons.delete",
  "english-learning.practice-tests.view", "english-learning.practice-tests.create", "english-learning.practice-tests.update", "english-learning.practice-tests.delete",
  "english-learning.questions.view", "english-learning.questions.create", "english-learning.questions.update", "english-learning.questions.delete",
  "english-learning.tutors.view", "english-learning.tutors.create", "english-learning.tutors.update", "english-learning.tutors.delete",
  "english-learning.resources.view", "english-learning.resources.create", "english-learning.resources.update", "english-learning.resources.delete",
  "english-learning.audit.view", "english-learning.referrals.view",
  // WhatsApp AI Agent
  "whatsapp.view", "whatsapp.send", "whatsapp.manage",
];

/**
 * Returns the full set of permissions granted to a role.
 * SUPER_ADMIN and OWNER receive every permission.
 */
export function rolePermissions(role: UserRole): Set<Permission> {
  if (role === "SUPER_ADMIN" || role === "OWNER") {
    return new Set(ALL_PERMISSIONS);
  }
  return new Set(MATRIX[role] ?? []);
}

/** True if `role` grants `perm`. */
export function hasPermission(role: UserRole | null | undefined, perm: Permission): boolean {
  if (!role) return false;
  return rolePermissions(role).has(perm);
}

/** Human-readable label for the admin UI. */
export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  OWNER: "Owner",
  EXECUTIVE_ASSISTANT: "Executive Assistant",
  CRM_MANAGER: "CRM Manager",
  PARTNERSHIP_MANAGER: "Partnership Manager",
  CONTENT_MANAGER: "Content Manager",
  MARKETING_MANAGER: "Marketing Manager",
  PROJECT_MANAGER: "Project Manager",
  AI_REVIEWER: "AI Reviewer",
  SECURITY_AUDITOR: "Security Auditor",
  VIEWER: "Viewer",
};

/** Roles that may appear in the login form picklist (excludes OWNER which is provisioned). */
export const SELECTABLE_ROLES: UserRole[] = ALL_ROLES.filter((r) => r !== "OWNER");

/** Normalize an unknown string into a UserRole, or null if invalid. */
export function normalizeRole(value: unknown): UserRole | null {
  if (typeof value !== "string") return null;
  return ALL_ROLES.includes(value as UserRole) ? (value as UserRole) : null;
}
