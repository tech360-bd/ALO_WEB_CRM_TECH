// ALO APPLICATION MANAGER — CORE SERVICE WITH B2B CONFIDENTIALITY
// Backend security enforcement — not frontend display:none

export const SAFE_STATUSES = [
  "DRAFT",
  "UNDER_REVIEW",
  "DOCUMENTS_REQUIRED",
  "SUBMITTED",
  "DECISION_PENDING",
  "OFFER_RECEIVED",
  "REJECTED",
  "DEFERRED",
  "VISA_PREPARATION",
] as const;

export const INTERNAL_STAGES = [
  "APPLICATION_DRAFT",
  "PROFILE_REVIEW",
  "DOCUMENT_COLLECTION",
  "DOCUMENT_REVIEW",
  "DOCUMENTS_REQUIRED",
  "READY_TO_SUBMIT",
  "SUBMITTED_TO_ALO_APPLICATION_TEAM",
  "TEAM_REVIEW",
  "SUBMITTED_TO_B2B",
  "B2B_SUBMITTED",
  "B2B_ACKNOWLEDGED",
  "SUBMITTED_TO_UNIVERSITY",
  "SUBMITTED_VIA_PORTAL",
  "SUBMITTED_VIA_EMAIL",
  "SUBMITTED_VIA_REP",
  "ACKNOWLEDGEMENT_RECEIVED",
  "APPLICATION_RECEIVED",
  "DECISION_PENDING",
  "MORE_DOCUMENTS_REQUESTED",
  "INTERVIEW_REQUIRED",
  "INTERVIEW_SCHEDULED",
  "CONDITIONAL_OFFER",
  "UNCONDITIONAL_OFFER",
  "OFFER_RECEIVED",
  "REJECTED",
  "DEFERRED",
  "WITHDRAWN",
  "DEPOSIT_PENDING",
  "DEPOSIT_PAID",
  "CAS_PENDING",
  "CAS_RECEIVED",
  "I20_PENDING",
  "I20_RECEIVED",
  "COE_PENDING",
  "COE_RECEIVED",
  "VISA_HANDOVER_READY",
  "VISA_FILE_CREATED",
  "VISA_PREPARATION",
  "VISA_SUBMITTED",
  "VISA_DECISION_PENDING",
  "VISA_APPROVED",
  "VISA_REFUSED",
  "PRE_DEPARTURE",
  "ENROLLED",
  "CLOSED",
] as const;

const UNIVERSITY_RESPONSE_STAGES = [
  "ACKNOWLEDGEMENT_RECEIVED", "APPLICATION_RECEIVED", "DECISION_PENDING", "MORE_DOCUMENTS_REQUESTED",
  "INTERVIEW_REQUIRED", "INTERVIEW_SCHEDULED", "CONDITIONAL_OFFER", "UNCONDITIONAL_OFFER",
  "OFFER_RECEIVED", "REJECTED", "DEFERRED", "WITHDRAWN",
] as const;

const SUBMITTED_UNIVERSITY_STAGES = [
  "SUBMITTED_VIA_PORTAL", "SUBMITTED_VIA_EMAIL", "SUBMITTED_VIA_REP", ...UNIVERSITY_RESPONSE_STAGES,
] as const;

const SUBMISSION_TARGETS = [
  "SUBMITTED_TO_ALO_APPLICATION_TEAM", "SUBMITTED_TO_B2B", "SUBMITTED_TO_UNIVERSITY",
  "SUBMITTED_VIA_PORTAL", "SUBMITTED_VIA_EMAIL", "SUBMITTED_VIA_REP",
] as const;

const RESUBMISSION_TARGETS = [
  "DOCUMENT_COLLECTION", "DOCUMENT_REVIEW", "DOCUMENTS_REQUIRED", "READY_TO_SUBMIT",
  ...SUBMISSION_TARGETS,
] as const;

const OFFER_STAGES = [
  "CONDITIONAL_OFFER", "UNCONDITIONAL_OFFER", "OFFER_RECEIVED", "DEPOSIT_PENDING", "DEPOSIT_PAID",
] as const;

/**
 * Explicit application lifecycle transitions. Rejected, withdrawn, enrolled
 * and closed applications are terminal; reopening requires a separate,
 * audited administrative workflow rather than an arbitrary status PATCH.
 */
export const APPLICATION_STAGE_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
  APPLICATION_DRAFT: ["PROFILE_REVIEW", "DOCUMENT_COLLECTION", "DOCUMENT_REVIEW", "DOCUMENTS_REQUIRED", "WITHDRAWN"],
  PROFILE_REVIEW: ["DOCUMENT_COLLECTION", "DOCUMENT_REVIEW", "DOCUMENTS_REQUIRED", "READY_TO_SUBMIT", "WITHDRAWN"],
  DOCUMENT_COLLECTION: ["PROFILE_REVIEW", "DOCUMENT_REVIEW", "DOCUMENTS_REQUIRED", "READY_TO_SUBMIT", "WITHDRAWN"],
  DOCUMENT_REVIEW: ["PROFILE_REVIEW", "DOCUMENT_COLLECTION", "DOCUMENTS_REQUIRED", "READY_TO_SUBMIT", "WITHDRAWN"],
  DOCUMENTS_REQUIRED: ["DOCUMENT_COLLECTION", "DOCUMENT_REVIEW", "READY_TO_SUBMIT", "WITHDRAWN"],
  READY_TO_SUBMIT: [...SUBMISSION_TARGETS, "WITHDRAWN"],
  SUBMITTED_TO_ALO_APPLICATION_TEAM: ["TEAM_REVIEW", "DOCUMENT_COLLECTION", "DOCUMENT_REVIEW", "DOCUMENTS_REQUIRED", "READY_TO_SUBMIT", "WITHDRAWN"],
  TEAM_REVIEW: ["DOCUMENT_COLLECTION", "DOCUMENT_REVIEW", "DOCUMENTS_REQUIRED", "READY_TO_SUBMIT", "SUBMITTED_TO_B2B", "SUBMITTED_TO_UNIVERSITY", "WITHDRAWN"],
  SUBMITTED_TO_B2B: ["B2B_SUBMITTED", "B2B_ACKNOWLEDGED", "WITHDRAWN"],
  B2B_SUBMITTED: ["B2B_ACKNOWLEDGED", "SUBMITTED_TO_UNIVERSITY", "WITHDRAWN"],
  B2B_ACKNOWLEDGED: ["SUBMITTED_TO_UNIVERSITY", "WITHDRAWN"],
  SUBMITTED_TO_UNIVERSITY: [...SUBMITTED_UNIVERSITY_STAGES],
  SUBMITTED_VIA_PORTAL: [...UNIVERSITY_RESPONSE_STAGES],
  SUBMITTED_VIA_EMAIL: [...UNIVERSITY_RESPONSE_STAGES],
  SUBMITTED_VIA_REP: [...UNIVERSITY_RESPONSE_STAGES],
  ACKNOWLEDGEMENT_RECEIVED: ["APPLICATION_RECEIVED", "DECISION_PENDING", "MORE_DOCUMENTS_REQUESTED", "INTERVIEW_REQUIRED", "INTERVIEW_SCHEDULED", "CONDITIONAL_OFFER", "UNCONDITIONAL_OFFER", "OFFER_RECEIVED", "REJECTED", "DEFERRED", "WITHDRAWN"],
  APPLICATION_RECEIVED: ["DECISION_PENDING", "MORE_DOCUMENTS_REQUESTED", "INTERVIEW_REQUIRED", "INTERVIEW_SCHEDULED", "CONDITIONAL_OFFER", "UNCONDITIONAL_OFFER", "OFFER_RECEIVED", "REJECTED", "DEFERRED", "WITHDRAWN"],
  DECISION_PENDING: ["MORE_DOCUMENTS_REQUESTED", "INTERVIEW_REQUIRED", "INTERVIEW_SCHEDULED", "CONDITIONAL_OFFER", "UNCONDITIONAL_OFFER", "OFFER_RECEIVED", "REJECTED", "DEFERRED", "WITHDRAWN"],
  MORE_DOCUMENTS_REQUESTED: [...RESUBMISSION_TARGETS, "WITHDRAWN"],
  INTERVIEW_REQUIRED: ["INTERVIEW_SCHEDULED", "DECISION_PENDING", "CONDITIONAL_OFFER", "UNCONDITIONAL_OFFER", "REJECTED", "DEFERRED", "WITHDRAWN"],
  INTERVIEW_SCHEDULED: ["DECISION_PENDING", "CONDITIONAL_OFFER", "UNCONDITIONAL_OFFER", "REJECTED", "DEFERRED", "WITHDRAWN"],
  CONDITIONAL_OFFER: [...OFFER_STAGES, "MORE_DOCUMENTS_REQUESTED", "CAS_PENDING", "I20_PENDING", "COE_PENDING", "REJECTED", "DEFERRED", "WITHDRAWN"],
  UNCONDITIONAL_OFFER: [...OFFER_STAGES, "MORE_DOCUMENTS_REQUESTED", "CAS_PENDING", "I20_PENDING", "COE_PENDING", "REJECTED", "DEFERRED", "WITHDRAWN"],
  OFFER_RECEIVED: [...OFFER_STAGES, "MORE_DOCUMENTS_REQUESTED", "CAS_PENDING", "I20_PENDING", "COE_PENDING", "REJECTED", "DEFERRED", "WITHDRAWN"],
  DEPOSIT_PENDING: ["DEPOSIT_PAID", "MORE_DOCUMENTS_REQUESTED", "REJECTED", "DEFERRED", "WITHDRAWN"],
  DEPOSIT_PAID: ["CAS_PENDING", "I20_PENDING", "COE_PENDING", "WITHDRAWN"],
  CAS_PENDING: ["CAS_RECEIVED", "MORE_DOCUMENTS_REQUESTED", "WITHDRAWN"],
  I20_PENDING: ["I20_RECEIVED", "MORE_DOCUMENTS_REQUESTED", "WITHDRAWN"],
  COE_PENDING: ["COE_RECEIVED", "MORE_DOCUMENTS_REQUESTED", "WITHDRAWN"],
  CAS_RECEIVED: ["VISA_HANDOVER_READY", "WITHDRAWN"],
  I20_RECEIVED: ["VISA_HANDOVER_READY", "WITHDRAWN"],
  COE_RECEIVED: ["VISA_HANDOVER_READY", "WITHDRAWN"],
  VISA_HANDOVER_READY: ["VISA_FILE_CREATED", "WITHDRAWN"],
  VISA_FILE_CREATED: ["VISA_PREPARATION", "WITHDRAWN"],
  VISA_PREPARATION: ["VISA_SUBMITTED", "WITHDRAWN"],
  VISA_SUBMITTED: ["VISA_DECISION_PENDING", "VISA_APPROVED", "VISA_REFUSED", "WITHDRAWN"],
  VISA_DECISION_PENDING: ["VISA_APPROVED", "VISA_REFUSED", "WITHDRAWN"],
  VISA_APPROVED: ["PRE_DEPARTURE", "ENROLLED", "CLOSED"],
  PRE_DEPARTURE: ["ENROLLED", "CLOSED"],
  DEFERRED: ["PROFILE_REVIEW", "DOCUMENT_COLLECTION", "READY_TO_SUBMIT", "WITHDRAWN"],
  REJECTED: [],
  VISA_REFUSED: [],
  WITHDRAWN: [],
  ENROLLED: [],
  CLOSED: [],
};

const LEGACY_STAGE_ALIASES: Record<string, string> = {
  DRAFT: "APPLICATION_DRAFT",
  COUNSELING: "APPLICATION_DRAFT",
  ACTIVE: "PROFILE_REVIEW",
};

export function normalizeApplicationStage(stage: string): string {
  const upper = stage.trim().toUpperCase();
  return LEGACY_STAGE_ALIASES[upper] || upper;
}

export function getAllowedApplicationStageTransitions(stage: string): string[] {
  return [...(APPLICATION_STAGE_TRANSITIONS[normalizeApplicationStage(stage)] || [])];
}

export function validateApplicationStageTransition(from: string, to: string): { ok: true } | { ok: false; reason: string } {
  const target = normalizeApplicationStage(to);
  if (!(INTERNAL_STAGES as readonly string[]).includes(target)) return { ok: false, reason: `Unknown application stage: ${to}` };
  const source = normalizeApplicationStage(from);
  if (!(INTERNAL_STAGES as readonly string[]).includes(source)) return { ok: false, reason: `Unknown current application stage: ${from}` };
  if (source === target) return { ok: true };
  if (!getAllowedApplicationStageTransitions(source).includes(target)) {
    return { ok: false, reason: `Transition ${source} → ${target} is not allowed` };
  }
  return { ok: true };
}

export const STAGE_TO_SAFE_STATUS: Record<string, string> = {
  APPLICATION_DRAFT: "DRAFT",
  PROFILE_REVIEW: "UNDER_REVIEW",
  DOCUMENT_COLLECTION: "DOCUMENTS_REQUIRED",
  DOCUMENT_REVIEW: "UNDER_REVIEW",
  DOCUMENTS_REQUIRED: "DOCUMENTS_REQUIRED",
  READY_TO_SUBMIT: "UNDER_REVIEW",
  SUBMITTED_TO_ALO_APPLICATION_TEAM: "UNDER_REVIEW",
  TEAM_REVIEW: "UNDER_REVIEW",
  SUBMITTED_TO_B2B: "SUBMITTED",
  B2B_SUBMITTED: "SUBMITTED",
  B2B_ACKNOWLEDGED: "SUBMITTED",
  SUBMITTED_TO_UNIVERSITY: "SUBMITTED",
  SUBMITTED_VIA_PORTAL: "SUBMITTED",
  SUBMITTED_VIA_EMAIL: "SUBMITTED",
  SUBMITTED_VIA_REP: "SUBMITTED",
  ACKNOWLEDGEMENT_RECEIVED: "SUBMITTED",
  APPLICATION_RECEIVED: "SUBMITTED",
  DECISION_PENDING: "DECISION_PENDING",
  MORE_DOCUMENTS_REQUESTED: "DOCUMENTS_REQUIRED",
  INTERVIEW_REQUIRED: "DECISION_PENDING",
  INTERVIEW_SCHEDULED: "DECISION_PENDING",
  CONDITIONAL_OFFER: "OFFER_RECEIVED",
  UNCONDITIONAL_OFFER: "OFFER_RECEIVED",
  OFFER_RECEIVED: "OFFER_RECEIVED",
  REJECTED: "REJECTED",
  DEFERRED: "DEFERRED",
  WITHDRAWN: "REJECTED",
  DEPOSIT_PENDING: "OFFER_RECEIVED",
  DEPOSIT_PAID: "OFFER_RECEIVED",
  CAS_PENDING: "VISA_PREPARATION",
  CAS_RECEIVED: "VISA_PREPARATION",
  I20_PENDING: "VISA_PREPARATION",
  I20_RECEIVED: "VISA_PREPARATION",
  COE_PENDING: "VISA_PREPARATION",
  COE_RECEIVED: "VISA_PREPARATION",
  VISA_HANDOVER_READY: "VISA_PREPARATION",
  VISA_FILE_CREATED: "VISA_PREPARATION",
  VISA_PREPARATION: "VISA_PREPARATION",
  VISA_SUBMITTED: "VISA_PREPARATION",
  VISA_DECISION_PENDING: "VISA_PREPARATION",
  VISA_APPROVED: "VISA_PREPARATION",
  VISA_REFUSED: "VISA_PREPARATION",
  PRE_DEPARTURE: "VISA_PREPARATION",
  ENROLLED: "VISA_PREPARATION",
  CLOSED: "VISA_PREPARATION",
  draft: "DRAFT",
  counseling: "DRAFT",
  research: "DRAFT",
  active: "UNDER_REVIEW",
};

export function mapStageToSafeStatus(stage: string): string {
  if (!stage) return "DRAFT";
  const upper = stage.toUpperCase();
  return STAGE_TO_SAFE_STATUS[upper] || STAGE_TO_SAFE_STATUS[stage] || "UNDER_REVIEW";
}

export const APPLICATION_SOURCES = [
  "DIRECT_ALO_APPLICATION",
  "STUDENT_SELF_APPLICATION",
  "PARTNER_APPLICATION",
  "B2B_INBOUND_APPLICATION",
  "B2B_OUTBOUND_APPLICATION",
  "UNIVERSITY_DIRECT_PORTAL",
  "MANUAL_IMPORT",
  "REFERRAL",
  "EVENT_SEMINAR_LEAD",
  "WEBSITE_COURSE_FINDER_LEAD",
] as const;

export const B2B_CONFIDENTIAL_FIELDS = [
  "b2bProviderId",
  "b2bType",
  "isB2b",
  "isB2bConfidential",
  "b2bReference",
  "b2bCommissionType",
  "b2bCommissionAmount",
  "b2bPaymentCondition",
  "b2bClaimStage",
  "b2bInternalNote",
  "b2bAttachments",
  "portalUrl",
  "loginNote",
  "commissionRule",
  "paymentCondition",
  "claimStage",
  "contactPerson",
  "providerEmail",
  "providerPhone",
  "internalNote",
  "agreementFile",
  "b2bProvider",
  "b2bApplications",
  "provider_code",
  "provider_name",
  "provider_contact",
  "provider_email",
  "provider_phone",
  "provider_portal_url",
  "provider_credentials",
  "provider_reference",
  "submission_method",
  "commission",
  "payment_condition",
  "claim_stage",
  "internal_notes",
  "attachments",
  "agreement",
] as const;

const B2B_COMMISSION_FIELDS = [
  "b2bCommissionAmount",
  "b2bCommissionType",
  "b2bPaymentCondition",
  "b2bClaimStage",
  "b2bCommissionStatus",
  "commissionRule",
  "paymentCondition",
  "claimStage",
  "commissionAmount",
  "commissionType",
  "commissionStatus",
  "b2bCommission",
  "commission",
] as const;

const B2B_CREDENTIAL_FIELDS = [
  "loginNote",
  "credentials",
  "providerCredentials",
  "provider_credentials",
  "username",
  "password",
  "accessToken",
  "refreshToken",
  "apiKey",
  "secret",
  "encryptedSecret",
] as const;

const B2B_ATTACHMENT_FIELDS = ["agreementFile", "b2bAttachments", "attachmentPath", "storagePath", "fileUrl"] as const;

function normalized(values: string[]): string[] {
  return values.map((value) => String(value).trim().toLowerCase());
}

/** B2B is an opt-in capability for Application Team; generic admin is not a grant. */
export function canViewB2B(roles: string[], permissions: string[]): boolean {
  const roleSet = new Set(normalized(roles));
  const permissionSet = new Set(normalized(permissions));
  if (["super_admin", "application_manager", "application-manager"].some((role) => roleSet.has(role))) return true;
  return [
    "application.view_b2b",
    "application.manage_b2b",
    "application.manage_b2b_providers",
    "application.view_b2b_providers",
  ].some((permission) => permissionSet.has(permission));
}

/** Commission data is implicit for Application Manager/Super Admin only. Finance and Application Team need the exact grant. */
export function canViewB2BCommission(roles: string[], permissions: string[]): boolean {
  const roleSet = new Set(normalized(roles));
  const permissionSet = new Set(normalized(permissions));
  return roleSet.has("super_admin") || roleSet.has("application_manager") || permissionSet.has("application.view_b2b_commission");
}

export function canManageB2B(roles: string[], permissions: string[]): boolean {
  const roleSet = new Set(normalized(roles));
  const permissionSet = new Set(normalized(permissions));
  if (roleSet.has("super_admin") || roleSet.has("application_manager") || roleSet.has("application-manager")) return true;
  return permissionSet.has("application.manage_b2b") || permissionSet.has("application.manage_b2b_providers");
}

export function canViewApplication(roles: string[]): boolean {
  const normalizedRoles = normalized(roles);
  return (
    normalizedRoles.includes("super_admin") ||
    normalizedRoles.includes("application_manager") ||
    normalizedRoles.includes("application_team") ||
    normalizedRoles.includes("counselor") ||
    normalizedRoles.includes("visa_officer") ||
    normalizedRoles.includes("finance") ||
    normalizedRoles.includes("admin")
  );
}

/**
 * Remove secrets and raw private-file paths from a B2B provider record. The
 * boolean says whether the caller may see commission policy; credentials are
 * deliberately never returned by a normal API response, including to managers.
 */
export function sanitizeB2BProvider<T extends Record<string, any>>(provider: T | null | undefined, canViewCommission: boolean): Partial<T> | null {
  if (!provider || typeof provider !== "object") return null;
  const safe: Record<string, any> = { ...provider };
  const hasStoredLoginNote = typeof safe.loginNote === "string" && safe.loginNote.length > 0;
  const hasAgreementFile = typeof safe.agreementFile === "string" && safe.agreementFile.length > 0;
  const hasB2bAttachments = typeof safe.b2bAttachments === "string" && safe.b2bAttachments.length > 0 && safe.b2bAttachments !== "[]";
  for (const field of B2B_CREDENTIAL_FIELDS) delete safe[field];
  for (const field of B2B_ATTACHMENT_FIELDS) delete safe[field];
  if (!canViewCommission) {
    for (const field of B2B_COMMISSION_FIELDS) delete safe[field];
  }
  if (Array.isArray(safe.b2bApplications)) {
    safe.b2bApplications = safe.b2bApplications.map((record: any) => sanitizeB2BApplicationRecord(record, canViewCommission));
  }
  safe.hasStoredLoginNote = hasStoredLoginNote;
  safe.hasAgreementFile = hasAgreementFile;
  if (hasB2bAttachments) safe.hasB2bAttachments = true;
  return safe as Partial<T>;
}

/** Remove all non-commission B2B fields when a finance-only grant is present. */
export function sanitizeB2BCommissionSummary(record: Record<string, any>): Record<string, any> {
  const summary: Record<string, any> = {};
  for (const field of ["b2bCommissionAmount", "b2bCommissionType", "b2bPaymentCondition", "b2bClaimStage", "b2bCommissionStatus"]) {
    if (Object.prototype.hasOwnProperty.call(record, field)) summary[field] = record[field];
  }
  return summary;
}

export function sanitizeB2BApplicationRecord<T extends Record<string, any>>(record: T, canViewCommission: boolean): Partial<T> {
  const safe: Record<string, any> = { ...record };
  for (const field of B2B_CREDENTIAL_FIELDS) delete safe[field];
  for (const field of B2B_ATTACHMENT_FIELDS) delete safe[field];
  if (!canViewCommission) {
    for (const field of B2B_COMMISSION_FIELDS) delete safe[field];
  }
  if (record.b2bProvider && typeof record.b2bProvider === "object") {
    safe.b2bProvider = sanitizeB2BProvider(record.b2bProvider, canViewCommission);
  }
  if (record.application && typeof record.application === "object") {
    safe.application = stripB2BFields(record.application, true, canViewCommission);
  }
  return safe as Partial<T>;
}

export function stripB2BFields<T extends Record<string, any>>(obj: T, canViewB2BFlag: boolean, canViewCommission: boolean): Partial<T> {
  const result: Record<string, any> = { ...obj };
  const originalB2bApplications = Array.isArray(obj.b2bApplications) ? obj.b2bApplications : [];
  const applicationSource = String(obj.applicationSource || "").toUpperCase();
  const stage = String(obj.stage || "").toUpperCase();
  const isB2bRecord = obj.isB2b === true || obj.isB2bConfidential === true || Boolean(obj.b2bProviderId) ||
    applicationSource.startsWith("B2B_") || stage.includes("B2B") || originalB2bApplications.length > 0;

  if (!canViewB2BFlag) {
    for (const field of B2B_CONFIDENTIAL_FIELDS) delete result[field];
    if (isB2bRecord) {
      // A B2B source/stage is confidential too; consumers can use only the
      // previously-computed safeStatus value for student/partner-facing views.
      delete result.applicationSource;
      delete result.sourceVisibility;
      delete result.stage;
      result.safeStatus = obj.safeStatus || mapStageToSafeStatus(String(obj.stage || ""));
    }
    if (canViewCommission) {
      const directCommission = sanitizeB2BCommissionSummary(obj);
      Object.assign(result, directCommission);
      const summaries = originalB2bApplications.map((record: any) => sanitizeB2BCommissionSummary(record))
        .filter((record: Record<string, any>) => Object.keys(record).length > 0);
      if (summaries.length) result.b2bApplications = summaries;
    }
    if (result.finance && typeof result.finance === "object" && !canViewCommission) {
      const finance = { ...result.finance };
      for (const field of B2B_COMMISSION_FIELDS) delete finance[field];
      result.finance = finance;
    }
    if (Array.isArray(result.documents)) result.documents = result.documents.map((document: any) => sanitizeApplicationDocumentRecord(document));
    return result as Partial<T>;
  }

  for (const field of B2B_CREDENTIAL_FIELDS) delete result[field];
  if (result.b2bProvider && typeof result.b2bProvider === "object") {
    result.b2bProvider = sanitizeB2BProvider(result.b2bProvider, canViewCommission);
  }
  if (result.b2bApplications && Array.isArray(result.b2bApplications)) {
    result.b2bApplications = result.b2bApplications.map((record: any) => sanitizeB2BApplicationRecord(record, canViewCommission));
  }
  if (result.b2bApplication && typeof result.b2bApplication === "object") {
    result.b2bApplication = sanitizeB2BApplicationRecord(result.b2bApplication, canViewCommission);
  }
  if (!canViewCommission) {
    for (const field of B2B_COMMISSION_FIELDS) delete result[field];
  }
  if (result.finance && typeof result.finance === "object" && !canViewCommission) {
    const finance = { ...result.finance };
    for (const field of B2B_COMMISSION_FIELDS) delete finance[field];
    result.finance = finance;
  }
  if (Array.isArray(result.documents)) result.documents = result.documents.map((document: any) => sanitizeApplicationDocumentRecord(document));
  return result as Partial<T>;
}

function sanitizeApplicationDocumentRecord<T extends Record<string, any>>(document: T): Partial<T> {
  const safe: Record<string, any> = { ...document };
  for (const field of ["fileUrl", "storagePath", "documentId", "signedUrl", "downloadUrl", "attachmentPath"]) delete safe[field];
  return safe as Partial<T>;
}

export function anonymizeTimelineEvent(event: any, canViewB2BFlag: boolean): any {
  if (canViewB2BFlag) return event;
  const visibility = String(event?.visibility || "").toLowerCase();
  const note = String(event?.note || "");
  const status = `${String(event?.oldStatus || "")} ${String(event?.newStatus || "")}`;
  const isConfidential = visibility === "b2b_confidential" || visibility === "b2b_internal" ||
    /\bb2b\b|provider|commission|portal credential/i.test(`${note} ${status}`);
  if (!isConfidential) return event;
  return {
    ...event,
    note: "Application Submitted",
    oldStatus: "",
    newStatus: event.safeStatus || "Submitted",
    visibility: "public_safe",
    changedBy: "System",
    actor: "System",
  };
}

export function filterCommentsByVisibility(comments: any[], canViewB2BFlag: boolean, userRole: string): any[] {
  const role = String(userRole || "").toLowerCase().replace(/[ -]/g, "_");
  return comments.filter((comment) => {
    const visibility = String(comment?.visibility || "").toLowerCase();
    const type = String(comment?.commentType || "").toLowerCase();
    const confidential = comment?.isB2bConfidential === true ||
      ["b2b_confidential", "b2b_internal"].includes(visibility) || type === "b2b_confidential";
    if (confidential) return canViewB2BFlag;
    if (["student", "student_self_application"].includes(role)) return ["student_visible", "public_safe"].includes(visibility);
    if (role.startsWith("partner")) return ["partner_visible", "student_visible", "public_safe"].includes(visibility);
    if (role.includes("counselor")) return ["counselor_visible", "student_visible", "public_safe", "internal"].includes(visibility);
    if (["application_manager", "application-manager", "application_team", "super_admin", "admin"].includes(role)) return true;
    if (["finance", "finance_manager"].includes(role)) return ["finance", "public_safe"].includes(visibility);
    if (role === "visa_officer") return ["visa_handover", "public_safe"].includes(visibility);
    return visibility === "public_safe";
  });
}

export function filterDocumentsByVisibility(docs: any[], canViewB2BFlag: boolean): any[] {
  if (canViewB2BFlag) return docs;
  return docs.filter((document) =>
    !document.isB2bConfidential &&
    !['b2b_confidential', 'b2b_internal'].includes(String(document.visibility || '').toLowerCase())
  );
}

// KPI definitions for dashboard
export const KPI_DEFINITIONS = [
  { key: "totalApplications", label: "Total Applications", icon: "FileCheck" },
  { key: "newToday", label: "New Today", icon: "Plus" },
  { key: "direct", label: "Direct Applications", icon: "User" },
  { key: "partner", label: "Partner Applications", icon: "Handshake" },
  { key: "b2b", label: "B2B Applications", icon: "Building2" },
  { key: "b2bInbound", label: "B2B Inbound", icon: "ArrowDownRight" },
  { key: "b2bOutbound", label: "B2B Outbound", icon: "ArrowUpRight" },
  { key: "submitted", label: "Submitted to University", icon: "Send" },
  { key: "decisionPending", label: "Decision Pending", icon: "Clock" },
  { key: "conditionalOffers", label: "Conditional Offers", icon: "Award" },
  { key: "unconditionalOffers", label: "Unconditional Offers", icon: "Award" },
  { key: "rejected", label: "Rejected", icon: "X" },
  { key: "deferred", label: "Deferred", icon: "Clock" },
  { key: "documentsPending", label: "Documents Pending", icon: "FileText" },
  { key: "casPending", label: "CAS / I-20 / COE Pending", icon: "Shield" },
  { key: "urgentDeadlines", label: "Urgent Deadlines", icon: "AlertTriangle" },
  { key: "pendingTasks", label: "Pending Tasks", icon: "CheckSquare" },
] as const;

export function calculateKPIs(applications: any[], b2bApplications: any[], documents: any[], deadlines: any[], tasks: any[]) {
  const todayStr = new Date().toDateString();
  return {
    totalApplications: applications.length,
    newToday: applications.filter((a) => new Date(a.createdAt).toDateString() === todayStr).length,
    direct: applications.filter((a) => a.applicationSource === "DIRECT_ALO_APPLICATION" || a.applicationSource === "STUDENT_SELF_APPLICATION" || !a.partnerId).length,
    partner: applications.filter((a) => a.applicationSource === "PARTNER_APPLICATION" || !!a.partnerId).length,
    b2b: b2bApplications.length,
    b2bInbound: b2bApplications.filter((b: any) => b.b2bType === "B2B_INBOUND" || b.b2bType === "INBOUND").length,
    b2bOutbound: b2bApplications.filter((b: any) => b.b2bType === "B2B_OUTBOUND" || b.b2bType === "OUTBOUND").length,
    submitted: applications.filter((a) => ["SUBMITTED_TO_UNIVERSITY", "SUBMITTED_VIA_PORTAL", "SUBMITTED_VIA_EMAIL", "SUBMITTED_TO_B2B", "B2B_SUBMITTED", "ACKNOWLEDGEMENT_RECEIVED", "APPLICATION_RECEIVED"].includes(a.stage) || a.safeStatus === "SUBMITTED").length,
    decisionPending: applications.filter((a) => a.stage === "DECISION_PENDING" || a.safeStatus === "DECISION_PENDING" || a.stage === "APPLICATION_SUBMITTED").length,
    conditionalOffers: applications.filter((a) => a.stage === "CONDITIONAL_OFFER" || a.offerStatus === "CONDITIONAL_OFFER").length,
    unconditionalOffers: applications.filter((a) => a.stage === "UNCONDITIONAL_OFFER" || a.offerStatus === "UNCONDITIONAL_OFFER").length,
    rejected: applications.filter((a) => a.stage === "REJECTED" || a.safeStatus === "REJECTED").length,
    deferred: applications.filter((a) => a.stage === "DEFERRED" || a.safeStatus === "DEFERRED").length,
    documentsPending: documents.filter((d) => ["MISSING", "UNDER_REVIEW", "PENDING", "REQUIRED"].includes(d.status)).length,
    casPending: applications.filter((a) => ["CAS_PENDING", "I20_PENDING", "COE_PENDING", "CAS_INTERVIEW"].includes(a.stage) || a.casI20CoeStatus === "PENDING").length,
    urgentDeadlines: deadlines.filter((d) => new Date(d.deadlineDate) <= new Date(Date.now() + 3 * 86400000)).length,
    pendingTasks: tasks.filter((t) => t.status === "PENDING").length,
  };
}
