// ============================================================
// ALO EDUCATION — GRANULAR PERMISSION SYSTEM TYPES
// One Student, One Profile, Many Views
// ============================================================

export type PermissionModule =
  | "student"
  | "documents"
  | "communication"
  | "applications"
  | "visa"
  | "marketing"
  | "hr_self"
  | "hr_private"
  | "sop_cv"
  | "tasks"
  | "reports"
  | "finance"
  | "partners"
  | "admin";

export type PermissionAction =
  // Generic CRUD
  | "view"
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "reject"
  | "export"
  | "download"
  | "upload_on_behalf"
  | "request"
  | "submit"
  | "review"
  | "archive"
  | "send"
  | "generate"
  // Student module — scoped view/update
  | "view_assigned"
  | "view_all"
  | "view_partner_referred"
  | "update_assigned"
  | "view_private_notes"
  | "view_internal_comments"
  // Communication module
  | "send_whatsapp"
  | "send_email"
  | "send_sms"
  | "use_ai_reply"
  | "approve_ai_reply"
  | "internal_comment"
  | "student_visible_comment"
  | "view_partner_email_updates"
  // Applications module
  | "create_draft"
  | "update_stage"
  | "submit_to_university"
  | "view_partner_submission_channel"
  | "view_commission_amount"
  // Visa module
  | "comment_internal"
  | "request_documents"
  | "interview_schedule"
  | "readiness_view"
  | "status_update"
  // Marketing module
  | "dashboard_view"
  | "content_generate"
  | "image_generate"
  | "video_generate"
  | "social_reply"
  | "auto_post"
  | "comment_to_lead"
  | "approve_ai_content"
  | "reports_view"
  // HR self-service
  | "self_profile_view"
  | "self_attendance_view"
  | "self_commission_view"
  | "self_bonus_view"
  | "self_increment_view"
  | "self_salary_view"
  | "self_documents_view"
  // HR private
  | "salary_manage"
  | "increment_manage"
  | "bonus_manage"
  | "attendance_manage"
  | "performance_manage"
  // Finance
  | "view_payments"
  | "view_commission"
  | "manage_commission"
  | "approve_commission"
  // Admin
  | "manage_permissions"
  | "view_all_data"
  | "manage_employees"
  | "manage_branches";

export type DataVisibility =
  | "own_only"
  | "assigned_only"
  | "partner_visible"
  | "student_visible"
  | "internal_only"
  | "all";

export type CommentVisibility =
  | "student_visible"
  | "internal_only"
  | "application_team_only"
  | "visa_team_only"
  | "finance_only"
  | "super_admin_only"
  | "partner_visible"
  | "counselor_visible";

export type CommentType =
  | "counselor_note"
  | "application_team_note"
  | "visa_officer_note"
  | "partner_submission_note"
  | "finance_note"
  | "risk_note"
  | "fraud_suspicious_note"
  | "refusal_analysis"
  | "commission_note";

export interface Permission {
  id: string;
  module: PermissionModule;
  feature: string;
  action: PermissionAction;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  label: string;
  description: string;
  isSystem: boolean;
}

export type RoleName =
  | "super_admin"
  | "branch_manager"
  | "counselor"
  | "application_officer"
  | "visa_officer"
  | "finance_officer"
  | "marketing_manager"
  | "hr_manager"
  | "employee";

// ============================================================
// COMPLETE PERMISSION CATALOG
// ============================================================

export const PERMISSION_CATALOG: Permission[] = [
  // --- STUDENT MODULE ---
  { id: "s1", module: "student", feature: "students", action: "view_assigned", description: "View assigned students" },
  { id: "s2", module: "student", feature: "students", action: "view_all", description: "View all company students" },
  { id: "s3", module: "student", feature: "students", action: "view_partner_referred", description: "View partner-referred students" },
  { id: "s4", module: "student", feature: "students", action: "update_assigned", description: "Update assigned student data" },
  { id: "s5", module: "student", feature: "students", action: "export", description: "Export student data" },
  { id: "s6", module: "student", feature: "students", action: "view_private_notes", description: "View private/internal notes" },
  { id: "s7", module: "student", feature: "students", action: "view_internal_comments", description: "View internal comments" },
  { id: "s8", module: "student", feature: "leads", action: "view_assigned", description: "View assigned leads" },
  { id: "s9", module: "student", feature: "leads", action: "create", description: "Create new lead" },

  // --- DOCUMENTS MODULE ---
  { id: "d1", module: "documents", feature: "documents", action: "view", description: "View documents" },
  { id: "d2", module: "documents", feature: "documents", action: "upload_on_behalf", description: "Upload document on behalf of student" },
  { id: "d3", module: "documents", feature: "documents", action: "request", description: "Request document from student" },
  { id: "d4", module: "documents", feature: "documents", action: "review", description: "Review document" },
  { id: "d5", module: "documents", feature: "documents", action: "approve", description: "Approve document" },
  { id: "d6", module: "documents", feature: "documents", action: "reject", description: "Reject document" },
  { id: "d7", module: "documents", feature: "documents", action: "download", description: "Download document" },
  { id: "d8", module: "documents", feature: "documents", action: "delete", description: "Delete document" },
  { id: "d9", module: "documents", feature: "documents", action: "archive", description: "Archive document" },

  // --- COMMUNICATION MODULE ---
  { id: "c1", module: "communication", feature: "communication", action: "view_assigned", description: "View assigned conversations" },
  { id: "c2", module: "communication", feature: "communication", action: "send_whatsapp", description: "Send WhatsApp message" },
  { id: "c3", module: "communication", feature: "communication", action: "send_email", description: "Send email" },
  { id: "c4", module: "communication", feature: "communication", action: "send_sms", description: "Send SMS" },
  { id: "c5", module: "communication", feature: "communication", action: "use_ai_reply", description: "Use AI suggested reply" },
  { id: "c6", module: "communication", feature: "communication", action: "approve_ai_reply", description: "Approve AI reply before sending" },
  { id: "c7", module: "communication", feature: "communication", action: "internal_comment", description: "Add internal comment to conversation" },
  { id: "c8", module: "communication", feature: "communication", action: "student_visible_comment", description: "Add student-visible comment" },
  { id: "c9", module: "communication", feature: "communication", action: "view_partner_email_updates", description: "View partner email updates" },

  // --- APPLICATIONS MODULE ---
  { id: "a1", module: "applications", feature: "applications", action: "view_assigned", description: "View assigned applications" },
  { id: "a2", module: "applications", feature: "applications", action: "create_draft", description: "Create application draft" },
  { id: "a3", module: "applications", feature: "applications", action: "update_stage", description: "Update application stage" },
  { id: "a4", module: "applications", feature: "applications", action: "submit_to_university", description: "Submit to university" },
  { id: "a5", module: "applications", feature: "applications", action: "view_partner_submission_channel", description: "View partner submission channel" },
  { id: "a6", module: "applications", feature: "applications", action: "view_commission_amount", description: "View commission amount" },

  // --- VISA MODULE ---
  { id: "v1", module: "visa", feature: "visa", action: "view", description: "View visa data" },
  { id: "v2", module: "visa", feature: "visa", action: "comment_internal", description: "Add internal visa comment" },
  { id: "v3", module: "visa", feature: "visa", action: "request_documents", description: "Request visa documents" },
  { id: "v4", module: "visa", feature: "visa", action: "interview_schedule", description: "Schedule visa interview" },
  { id: "v5", module: "visa", feature: "visa", action: "readiness_view", description: "View visa readiness score" },
  { id: "v6", module: "visa", feature: "visa", action: "status_update", description: "Update visa status" },

  // --- MARKETING MODULE ---
  { id: "m1", module: "marketing", feature: "marketing", action: "dashboard_view", description: "View marketing dashboard" },
  { id: "m2", module: "marketing", feature: "marketing", action: "content_generate", description: "Generate marketing content" },
  { id: "m3", module: "marketing", feature: "marketing", action: "image_generate", description: "Generate images" },
  { id: "m4", module: "marketing", feature: "marketing", action: "video_generate", description: "Generate videos" },
  { id: "m5", module: "marketing", feature: "marketing", action: "social_reply", description: "Reply to social comments" },
  { id: "m6", module: "marketing", feature: "marketing", action: "auto_post", description: "Auto post to social channels" },
  { id: "m7", module: "marketing", feature: "marketing", action: "comment_to_lead", description: "Convert comments to leads" },
  { id: "m8", module: "marketing", feature: "marketing", action: "approve_ai_content", description: "Approve AI content" },
  { id: "m9", module: "marketing", feature: "marketing", action: "reports_view", description: "View marketing reports" },

  // --- HR SELF MODULE ---
  { id: "h1", module: "hr_self", feature: "employee", action: "self_profile_view", description: "View own profile" },
  { id: "h2", module: "hr_self", feature: "employee", action: "self_attendance_view", description: "View own attendance" },
  { id: "h3", module: "hr_self", feature: "employee", action: "self_commission_view", description: "View own commission" },
  { id: "h4", module: "hr_self", feature: "employee", action: "self_bonus_view", description: "View own bonus" },
  { id: "h5", module: "hr_self", feature: "employee", action: "self_increment_view", description: "View own increment" },
  { id: "h6", module: "hr_self", feature: "employee", action: "self_salary_view", description: "View own salary" },
  { id: "h7", module: "hr_self", feature: "employee", action: "self_documents_view", description: "View own HR documents" },

  // --- HR PRIVATE MODULE ---
  { id: "hp1", module: "hr_private", feature: "hr", action: "salary_manage", description: "Manage employee salary" },
  { id: "hp2", module: "hr_private", feature: "hr", action: "increment_manage", description: "Manage increments" },
  { id: "hp3", module: "hr_private", feature: "hr", action: "bonus_manage", description: "Manage bonuses" },
  { id: "hp4", module: "hr_private", feature: "hr", action: "attendance_manage", description: "Manage attendance" },
  { id: "hp5", module: "hr_private", feature: "hr", action: "performance_manage", description: "Manage performance" },

  // --- FINANCE MODULE ---
  { id: "f1", module: "finance", feature: "finance", action: "view_payments", description: "View payments" },
  { id: "f2", module: "finance", feature: "finance", action: "view_commission", description: "View commission data" },
  { id: "f3", module: "finance", feature: "finance", action: "manage_commission", description: "Manage commission" },
  { id: "f4", module: "finance", feature: "finance", action: "approve_commission", description: "Approve commission" },

  // --- ADMIN MODULE ---
  { id: "ad1", module: "admin", feature: "admin", action: "manage_permissions", description: "Manage role permissions" },
  { id: "ad2", module: "admin", feature: "admin", action: "view_all_data", description: "View all data" },
  { id: "metrics.read", module: "admin", feature: "metrics", action: "view", description: "Read centralized verified metrics and governance state" },
  { id: "metrics.manage", module: "admin", feature: "metrics", action: "update", description: "Govern centralized verified metrics (sync, verify, expire)" },
  { id: "ad3", module: "admin", feature: "admin", action: "manage_employees", description: "Manage employees" },
  { id: "ad4", module: "admin", feature: "admin", action: "manage_branches", description: "Manage branches" },
];

// ============================================================
// DEFAULT ROLE PERMISSIONS
// ============================================================

export const DEFAULT_ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  super_admin: PERMISSION_CATALOG.map((p) => p.id),
  branch_manager: [
    "s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9",
    "d1", "d2", "d3", "d4", "d5", "d6", "d7", "d9",
    "c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9",
    "a1", "a2", "a3", "a4", "a5",
    "v1", "v2", "v3", "v4", "v5", "v6",
    "h1", "h2", "h3", "h4", "h5", "h6", "h7",
    "hp1", "hp2", "hp3", "hp4", "hp5",
    "f1", "f2", "f3", "f4",
    "ad1", "ad2", "ad3", "ad4",
  ],
  counselor: [
    "s1", "s3", "s4", "s6", "s8", "s9",
    "d1", "d2", "d3", "d7",
    "c1", "c2", "c3", "c4", "c5", "c7", "c8",
    "a1", "a2", "a3",
    "v1", "v3", "v5",
    "h1", "h2", "h3", "h4", "h5", "h6", "h7",
  ],
  application_officer: [
    "s1", "s2", "s4",
    "d1", "d2", "d3", "d4", "d5", "d6", "d7", "d9",
    "c1", "c3", "c7", "c9",
    "a1", "a2", "a3", "a4", "a5",
  ],
  visa_officer: [
    "s1", "s2",
    "d1", "d3", "d4", "d5", "d6", "d7",
    "c1", "c7",
    "a1",
    "v1", "v2", "v3", "v4", "v5", "v6",
  ],
  finance_officer: [
    "s1", "s2",
    "d1", "d7",
    "c1",
    "a1", "a5", "a6",
    "f1", "f2", "f3", "f4",
  ],
  marketing_manager: [
    "s2", "s5",
    "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9",
    "c1", "c5", "c7",
  ],
  hr_manager: [
    "s1", "s2",
    "h1", "h2", "h3", "h4", "h5", "h6", "h7",
    "hp1", "hp2", "hp3", "hp4", "hp5",
  ],
  employee: [
    "h1", "h2", "h3", "h4", "h5", "h6", "h7",
  ],
};

// ============================================================
// STUDENT ID GENERATION
// Use src/lib/identity/student-id.ts (sequence-allocated). Random generation was removed.
// ============================================================

// ============================================================
// SLA CONSTANTS
// ============================================================

export const SLA_RULES = {
  first_response_target_minutes: 30,
  warning_after_minutes: 30,
  escalate_to_branch_manager_minutes: 40,
  escalate_to_admin_minutes: 50,
  after_hours_ai_reply: true,
} as const;

export type SlaEventType = "warning" | "escalated_bm" | "escalated_admin" | "resolved" | "ai_handled";

// ============================================================
// JOURNEY STAGES
// ============================================================

export const JOURNEY_STAGES = [
  "lead_created",
  "counseling",
  "english_test",
  "document_collection",
  "sop_cv_preparation",
  "application_draft",
  "application_submitted",
  "offer_received",
  "cas_received",
  "visa_prep",
  "visa_interview",
  "visa_approved",
  "pre_departure",
  "enrolled",
] as const;

export type JourneyStage = (typeof JOURNEY_STAGES)[number];

// ============================================================
// APPLICATION STAGES
// ============================================================

export const APPLICATION_STAGES = [
  "research",
  "shortlisted",
  "counseling",
  "document_ready",
  "sop_ready",
  "submitted",
  "under_review",
  "offer_received",
  "offer_accepted",
  "cas_pending",
  "cas_received",
  "visa_applied",
  "visa_approved",
  "enrolled",
  "withdrawn",
  "rejected",
] as const;

// ============================================================
// CHANNEL TYPES
// ============================================================

export const COMMUNICATION_CHANNELS = [
  "whatsapp",
  "sms",
  "email",
  "website_chat",
  "facebook",
  "instagram",
  "messenger",
  "portal_message",
  "call_note",
] as const;

export type CommunicationChannel = (typeof COMMUNICATION_CHANNELS)[number];