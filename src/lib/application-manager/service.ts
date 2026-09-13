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
  "CLOSED",
] as const;

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
  CLOSED: "VISA_PREPARATION",
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

export function canViewB2B(roles: string[], permissions: string[]): boolean {
  const normalizedRoles = roles.map(r => r.toLowerCase());
  if (
    normalizedRoles.includes("super_admin") ||
    normalizedRoles.includes("application_manager") ||
    normalizedRoles.includes("application_team") ||
    normalizedRoles.includes("application-manager") ||
    normalizedRoles.includes("admin")
  ) return true;
  if (
    permissions.includes("application.view_b2b") ||
    permissions.includes("application.manage_b2b") ||
    permissions.includes("application.manage_b2b_providers") ||
    permissions.includes("application.view_b2b_providers")
  ) return true;
  return false;
}

export function canViewB2BCommission(roles: string[], permissions: string[]): boolean {
  const normalizedRoles = roles.map(r => r.toLowerCase());
  if (normalizedRoles.includes("super_admin") || normalizedRoles.includes("finance_manager") || normalizedRoles.includes("finance")) return true;
  if (permissions.includes("application.view_b2b_commission") || permissions.includes("finance.view") || permissions.includes("application.manage_b2b")) return true;
  return false;
}

export function canManageB2B(roles: string[], permissions: string[]): boolean {
  const normalizedRoles = roles.map(r => r.toLowerCase());
  if (normalizedRoles.includes("super_admin") || normalizedRoles.includes("application_manager")) return true;
  if (permissions.includes("application.manage_b2b") || permissions.includes("application.manage_b2b_providers")) return true;
  return false;
}

export function canViewApplication(roles: string[]): boolean {
  const normalizedRoles = roles.map(r => r.toLowerCase());
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

export function stripB2BFields<T extends Record<string, any>>(obj: T, canViewB2BFlag: boolean, canViewCommission: boolean): Partial<T> {
  if (canViewB2BFlag) {
    if (!canViewCommission) {
      const { b2bCommissionAmount, b2bCommissionType, b2bPaymentCondition, b2bClaimStage, commissionRule, paymentCondition, claimStage, b2bCommission, commission, ...rest } = obj as any;
      return rest;
    }
    return obj;
  }
  const result: any = { ...obj };
  for (const field of B2B_CONFIDENTIAL_FIELDS) {
    delete result[field];
  }
  // Also strip nested b2bProvider details if present
  if (result.b2bProvider) {
    delete result.b2bProvider;
  }
  if (result.b2bApplication) {
    const b2bApp = result.b2bApplication;
    delete b2bApp.b2bProvider;
    delete b2bApp.b2bInternalNote;
    delete b2bApp.b2bCommissionAmount;
    delete b2bApp.b2bCommissionType;
    delete b2bApp.b2bPaymentCondition;
    delete b2bApp.b2bClaimStage;
    result.b2bApplication = {
      id: b2bApp.id,
      b2bStatus: b2bApp.b2bStatus,
      b2bType: canViewB2BFlag ? b2bApp.b2bType : undefined,
      submittedDate: b2bApp.submittedDate,
    };
  }
  return result;
}

export function anonymizeTimelineEvent(event: any, canViewB2BFlag: boolean): any {
  if (canViewB2BFlag) return event;
  if (event.visibility === "B2B_CONFIDENTIAL" || event.visibility === "b2b_confidential") {
    return {
      ...event,
      note: "Application Submitted",
      newStatus: event.safeStatus || "Submitted",
      visibility: "public_safe",
      changedBy: "System",
    };
  }
  // Replace B2B provider mentions in note
  let note = event.note || "";
  if (note.toLowerCase().includes("b2b")) {
    note = "Application Submitted";
  }
  return { ...event, note };
}

export function filterCommentsByVisibility(comments: any[], canViewB2BFlag: boolean, userRole: string): any[] {
  if (canViewB2BFlag) return comments;
  return comments.filter((c) => {
    if (c.isB2bConfidential) return false;
    if (c.visibility === "B2B_CONFIDENTIAL" || c.visibility === "b2b_confidential" || c.visibility === "b2b_internal") return false;
    if (c.commentType === "B2B_CONFIDENTIAL") return false;
    return true;
  });
}

export function filterDocumentsByVisibility(docs: any[], canViewB2BFlag: boolean): any[] {
  if (canViewB2BFlag) return docs;
  return docs.filter((d) => !d.isB2bConfidential);
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
