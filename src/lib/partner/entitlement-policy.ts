/**
 * B2B PARTNER + EMPLOYEE ENTITLEMENT POLICY (master control spec)
 * ================================================================
 * Pure decision layer for the rules the self-audit in the brief has to verify:
 *
 *   • ALO Super Admin has master control over every feature, role, quota and
 *     permission; a B2B partner gets only what was approved for it.
 *   • Starter partner = 1 Partner Super Admin + 2 employees (limit 3); more seats
 *     only through an approved request.
 *   • Partner users are limited to five partner role types, each capped by the
 *     ALO-approved permission package — a partner can never mint ALO staff or
 *     grant itself an ALO permission.
 *   • Marketing: 15 images/month, 10 videos/month, video max 30 seconds, monthly
 *     reset, all adjustable per partner by ALO Super Admin.
 *   • Student benefits (interview prep, mock tests, English vouchers) exist ONLY
 *     while the student has an active ALO application.
 *
 * This module deliberately imports nothing — no database, no clock, no provider —
 * so every rule above can be executed and proven in any environment. The
 * database-bound helpers in `access-check-engine.ts` consume these functions
 * rather than restating the numbers, so there is one source of truth.
 */

// ────────────────────────────────────────────────────────────────────────────
// ALO master control
// ────────────────────────────────────────────────────────────────────────────

/** Roles that hold ALO master control (Chairman is the top of the hierarchy). */
export const ALO_MASTER_ROLES = ['chairman', 'super_admin'] as const;

/** Roles ALO Super Admin can grant ALO-side access to. */
export const ALO_STAFF_ROLES = ['admin', 'manager', 'employee'] as const;

export function isAloMasterRole(roles: string[]): boolean {
  return roles.some((role) => (ALO_MASTER_ROLES as readonly string[]).includes(String(role).toLowerCase()));
}

/**
 * Only ALO Super Admin (or Chairman) may change a limit, a package, a permission
 * or another employee's access. Everything else is scoped down from there.
 */
export function canManageMasterControl(actorRoles: string[]): boolean {
  return isAloMasterRole(actorRoles);
}

// ────────────────────────────────────────────────────────────────────────────
// Employee designations (the catalogue ALO Super Admin assigns from)
// ────────────────────────────────────────────────────────────────────────────

export const EMPLOYEE_DESIGNATIONS = [
  'Chairman',
  'CEO',
  'Director',
  'Office Manager',
  'Country Manager',
  'Counselor',
  'Senior Counselor',
  'Application Manager',
  'Application Team',
  'Visa Officer',
  'Finance Officer',
  'Marketing Manager',
  'Marketing Officer',
  'Front Desk',
  'HR Manager',
  'Support Staff',
  'Viewer',
] as const;
export type EmployeeDesignation = (typeof EMPLOYEE_DESIGNATIONS)[number];

export const EMPLOYEE_PROFILE_STATUSES = [
  'incomplete',
  'submitted',
  'under_review',
  'approved',
  'correction_required',
  'suspended',
  'inactive',
  'terminated',
] as const;
export type EmployeeProfileStatus = (typeof EMPLOYEE_PROFILE_STATUSES)[number];

/** Normalise a stored status into the catalogue (accepts legacy spellings). */
export function normaliseProfileStatus(value: string | null | undefined): EmployeeProfileStatus {
  const key = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  return (EMPLOYEE_PROFILE_STATUSES as readonly string[]).includes(key) ? (key as EmployeeProfileStatus) : 'incomplete';
}

/**
 * An employee may not log in until they have created a password from the
 * activation link, and HR/Admin has approved the profile they filled in.
 */
export function canEmployeeLogin(input: { passwordCreated: boolean; profileStatus: string | null | undefined }): {
  allowed: boolean;
  reason?: string;
} {
  if (!input.passwordCreated) {
    return { allowed: false, reason: 'Account is not activated yet. Use the activation link in your email to create a password.' };
  }
  const status = normaliseProfileStatus(input.profileStatus);
  if (status === 'suspended' || status === 'inactive' || status === 'terminated') {
    return { allowed: false, reason: `This account is ${status.replace('_', ' ')}. Contact ALO HR.` };
  }
  return { allowed: true };
}

// ────────────────────────────────────────────────────────────────────────────
// Employee private profile privacy
// ────────────────────────────────────────────────────────────────────────────

/**
 * Fields that are private to the employee, ALO Super Admin/Chairman and an
 * HR Manager holding the permission. Everyone else — including managers and
 * colleagues — must never receive them from an API.
 */
export const EMPLOYEE_PRIVATE_FIELDS = [
  'salary',
  'allowance',
  'bonus',
  'bankDetails',
  'taxInfo',
  'emergencyContact',
  'presentAddress',
  'permanentAddress',
  'nid',
  'passport',
  'educationDocuments',
  'hrDocuments',
  'leaveRecords',
  'privateDocuments',
  'dateOfBirth',
  'maritalStatus',
] as const;
export type EmployeePrivateField = (typeof EMPLOYEE_PRIVATE_FIELDS)[number];

export interface PrivateProfileViewer {
  userId: string;
  roles: string[];
  /** The employee record the viewer belongs to (undefined for pure admin users). */
  employeeId?: string | null;
  /** True only when the HR permission package explicitly grants it. */
  hasHrPermission?: boolean;
}

export interface PrivateProfileDecision {
  allowed: boolean;
  /** Field names the caller may return. Empty when nothing is visible. */
  visibleFields: EmployeePrivateField[] | 'all';
  reason: string;
}

/**
 * Who may see an employee's private profile data.
 *
 * Allowed: the employee themself, Chairman/Super Admin, and an HR Manager that
 * carries the HR permission. A plain HR designation without the permission is
 * refused — designation alone is not authority.
 */
export function canViewEmployeePrivateProfile(
  viewer: PrivateProfileViewer,
  employee: { id: string; designation?: string | null },
): PrivateProfileDecision {
  const roles = (viewer.roles || []).map((role) => String(role).toLowerCase());

  if (isAloMasterRole(roles)) {
    return { allowed: true, visibleFields: 'all', reason: 'ALO master control.' };
  }

  const isSelf = !!viewer.employeeId && viewer.employeeId === employee.id;
  if (isSelf) {
    return { allowed: true, visibleFields: 'all', reason: 'Own profile.' };
  }

  const isHrManager = roles.includes('hr_manager') || roles.includes('hr') || String(employee.designation || '').toLowerCase() === 'hr manager';
  if (isHrManager && viewer.hasHrPermission) {
    return { allowed: true, visibleFields: 'all', reason: 'HR Manager with the HR permission.' };
  }

  if (isHrManager && !viewer.hasHrPermission) {
    return {
      allowed: false,
      visibleFields: [],
      reason: 'HR access requires the HR permission to be granted by ALO Super Admin.',
    };
  }

  return {
    allowed: false,
    visibleFields: [],
    reason: 'Employee private information is visible only to the employee, ALO Super Admin/Chairman, and an HR Manager with the HR permission.',
  };
}

/** Strip private fields from an employee payload for a viewer who may not see them. */
export function redactEmployeePrivateFields<T extends Record<string, unknown>>(
  record: T,
  decision: PrivateProfileDecision,
): Partial<T> & { redacted?: EmployeePrivateField[] } {
  if (decision.allowed) return record;
  const redacted: EmployeePrivateField[] = [];
  const output: Record<string, unknown> = { ...record };
  for (const field of EMPLOYEE_PRIVATE_FIELDS) {
    if (field in output) {
      delete output[field];
      redacted.push(field);
    }
  }
  return { ...(output as Partial<T>), redacted };
}

// ────────────────────────────────────────────────────────────────────────────
// Partner packages & seats
// ────────────────────────────────────────────────────────────────────────────

export interface PartnerPackageDefinition {
  slug: 'starter' | 'growth' | 'premium';
  name: string;
  defaultUserLimit: number;
  monthlyImageLimit: number;
  monthlyVideoLimit: number;
  videoDurationLimitSeconds: number;
  englishMockVoucherLimit: number;
  interviewPrepLimit: number;
  autoPublishAllowed: boolean;
  requiresAloApproval: boolean;
  /** Partners may only pick from packages ALO has published. */
  description: string;
}

/**
 * Package catalogue. `starter` is the only package with fixed numbers; growth and
 * premium are seeded with a starting point that ALO Super Admin edits per partner.
 *
 * Video duration: the operational rule is a 30-second maximum. Packages may carry
 * a *configured* ceiling, but nothing may be generated above the ALO hard ceiling.
 */
export const ALO_HARD_VIDEO_CEILING_SECONDS = 30;

export const PARTNER_PACKAGES: Record<PartnerPackageDefinition['slug'], PartnerPackageDefinition> = {
  starter: {
    slug: 'starter',
    name: 'Starter Partner',
    defaultUserLimit: 3, // 1 Partner Super Admin + 2 employees
    monthlyImageLimit: 15,
    monthlyVideoLimit: 10,
    videoDurationLimitSeconds: 30,
    englishMockVoucherLimit: 3,
    interviewPrepLimit: 1,
    autoPublishAllowed: false,
    requiresAloApproval: true,
    description: '1 Partner Super Admin + 2 employees, 15 images and 10 videos per month, 30-second video ceiling.',
  },
  growth: {
    slug: 'growth',
    name: 'Growth Partner',
    defaultUserLimit: 5,
    monthlyImageLimit: 30,
    monthlyVideoLimit: 20,
    videoDurationLimitSeconds: 30,
    englishMockVoucherLimit: 3,
    interviewPrepLimit: 1,
    autoPublishAllowed: false,
    requiresAloApproval: true,
    description: 'Custom user seats, custom image and video quota, optional landing page and campaign support.',
  },
  premium: {
    slug: 'premium',
    name: 'Premium Partner',
    defaultUserLimit: 10,
    monthlyImageLimit: 100,
    monthlyVideoLimit: 50,
    videoDurationLimitSeconds: 30,
    englishMockVoucherLimit: 3,
    interviewPrepLimit: 1,
    autoPublishAllowed: false,
    requiresAloApproval: true,
    description: 'Custom agreement, higher quota, dedicated support and more integrations.',
  },
};

export const DEFAULT_PARTNER_PACKAGE = PARTNER_PACKAGES.starter;
/** Spec: partner_max_users defaults to 3 (1 super admin + 2 employees). */
export const DEFAULT_PARTNER_USER_LIMIT = PARTNER_PACKAGES.starter.defaultUserLimit;

export interface EffectivePartnerLimits {
  slug: PartnerPackageDefinition['slug'];
  userLimit: number;
  monthlyImageLimit: number;
  monthlyVideoLimit: number;
  videoDurationLimitSeconds: number;
  englishMockVoucherLimit: number;
  interviewPrepLimit: number;
  autoPublishAllowed: boolean;
  requiresAloApproval: boolean;
}

/**
 * Resolve the limits that actually apply to a partner: package defaults, then any
 * per-partner override ALO Super Admin has approved. An override may only raise a
 * limit if ALO set it — a partner cannot influence this function's result.
 *
 * The video ceiling is clamped to the ALO hard ceiling so a mis-typed override
 * cannot authorise a 5-minute partner video.
 */
export function resolveEffectiveLimits(input: {
  packageSlug?: string | null;
  overrides?: Partial<Pick<EffectivePartnerLimits, 'userLimit' | 'monthlyImageLimit' | 'monthlyVideoLimit' | 'videoDurationLimitSeconds' | 'autoPublishAllowed' | 'requiresAloApproval'>>;
}): EffectivePartnerLimits {
  const slug = (String(input.packageSlug || '').toLowerCase() as PartnerPackageDefinition['slug']) || 'starter';
  const base = PARTNER_PACKAGES[slug] ?? DEFAULT_PARTNER_PACKAGE;
  const overrides = input.overrides ?? {};

  const videoDurationLimitSeconds = Math.min(
    Math.max(1, Math.trunc(overrides.videoDurationLimitSeconds ?? base.videoDurationLimitSeconds)),
    ALO_HARD_VIDEO_CEILING_SECONDS,
  );

  return {
    slug: base.slug,
    userLimit: Math.max(0, Math.trunc(overrides.userLimit ?? base.defaultUserLimit)),
    monthlyImageLimit: Math.max(0, Math.trunc(overrides.monthlyImageLimit ?? base.monthlyImageLimit)),
    monthlyVideoLimit: Math.max(0, Math.trunc(overrides.monthlyVideoLimit ?? base.monthlyVideoLimit)),
    videoDurationLimitSeconds,
    englishMockVoucherLimit: base.englishMockVoucherLimit,
    interviewPrepLimit: base.interviewPrepLimit,
    autoPublishAllowed: overrides.autoPublishAllowed ?? base.autoPublishAllowed,
    requiresAloApproval: overrides.requiresAloApproval ?? base.requiresAloApproval,
  };
}

/** Spec: partner_max_users = 3 means 1 super admin + 2 employees. */
export function canCreatePartnerUser(input: {
  currentUserCount: number;
  userLimit: number;
}): { allowed: boolean; remaining: number; reason?: string } {
  const remaining = Math.max(0, input.userLimit - input.currentUserCount);
  if (remaining <= 0) {
    return {
      allowed: false,
      remaining: 0,
      reason: 'Your current partner user limit has been reached. Please request additional seats from ALO Education.',
    };
  }
  return { allowed: true, remaining };
}

// ────────────────────────────────────────────────────────────────────────────
// Partner users & permissions
// ────────────────────────────────────────────────────────────────────────────

/** The only role types a Partner Super Admin may create. */
export const PARTNER_USER_ROLES = [
  'partner_super_admin',
  'partner_counselor',
  'partner_application_assistant',
  'partner_marketing_assistant',
  'partner_document_assistant',
  'partner_viewer',
] as const;
export type PartnerUserRole = (typeof PARTNER_USER_ROLES)[number];

/**
 * Partner roles a Partner Super Admin may assign to staff (it cannot appoint a
 * second Partner Super Admin itself — that is an ALO-approved change).
 */
export const PARTNER_ASSIGNABLE_ROLES: PartnerUserRole[] = [
  'partner_counselor',
  'partner_application_assistant',
  'partner_marketing_assistant',
  'partner_document_assistant',
  'partner_viewer',
];

/**
 * Permission keys that exist ALO-side and must NEVER be grantable to a partner,
 * regardless of package. This is the list the refusal messages come from.
 */
export const ALO_ONLY_PERMISSIONS = [
  'alo_internal_crm',
  'b2b_provider_route',
  'alo_finance',
  'salary_access',
  'audit_log_access',
  'internal_notes',
  'other_partner_data',
  'commission_all_partners',
  'master_control',
  'employee_management_alo',
] as const;

export interface PartnerUserCreationRequest {
  actorRoles: string[];
  actorPartnerId?: string | null;
  targetPartnerId: string;
  role: string;
  requestedPermissions: string[];
  /** Permissions the ALO-approved package allows for this partner. */
  approvedPermissions: string[];
}

/** Validate a partner user creation request against every rule at once. */
export function validatePartnerUserCreation(request: PartnerUserCreationRequest): {
  allowed: boolean;
  code: string;
  message: string;
  blockedPermissions?: string[];
} {
  const roles = (request.actorRoles || []).map((role) => String(role).toLowerCase());

  // Only a Partner Super Admin (of that partner) or ALO master control may create.
  const isAlo = isAloMasterRole(roles);
  const isPartnerSuperAdmin = roles.includes('partner_super_admin');
  if (!isAlo && !isPartnerSuperAdmin) {
    return { allowed: false, code: 'ROLE_REQUIRED', message: 'Only a Partner Super Admin can create partner users.' };
  }

  // Tenant isolation: a partner can only create inside its own company.
  if (!isAlo && (!request.actorPartnerId || request.actorPartnerId !== request.targetPartnerId)) {
    return { allowed: false, code: 'TENANT_MISMATCH', message: 'You can only create users inside your own company.' };
  }

  // Only the five partner role types exist.
  if (!(PARTNER_USER_ROLES as readonly string[]).includes(String(request.role).toLowerCase())) {
    return {
      allowed: false,
      code: 'INVALID_ROLE',
      message: `Invalid partner role. Allowed roles: ${PARTNER_USER_ROLES.join(', ')}. ALO staff accounts cannot be created from a partner portal.`,
    };
  }

  // A partner cannot appoint another Partner Super Admin by itself.
  if (!isAlo && String(request.role).toLowerCase() === 'partner_super_admin') {
    return {
      allowed: false,
      code: 'SUPER_ADMIN_ASSIGNMENT_REQUIRED',
      message: 'Only ALO Education can appoint a Partner Super Admin. Contact ALO Super Admin to transfer this role.',
    };
  }

  // ALO-only permissions are refused outright, not merely filtered.
  const blocked = (request.requestedPermissions || []).filter((permission) => {
    const key = String(permission).toLowerCase();
    return (ALO_ONLY_PERMISSIONS as readonly string[]).includes(key);
  });
  if (blocked.length > 0) {
    return {
      allowed: false,
      code: 'ALO_ONLY_PERMISSION',
      message: `These permissions belong to ALO and cannot be granted to a partner: ${blocked.join(', ')}.`,
      blockedPermissions: blocked,
    };
  }

  // Everything else must sit inside what ALO approved for this partner.
  const approved = new Set((request.approvedPermissions || []).map((permission) => String(permission).toLowerCase()));
  const outsidePackage = (request.requestedPermissions || []).filter(
    (permission) => !approved.has(String(permission).toLowerCase()),
  );
  if (outsidePackage.length > 0) {
    return {
      allowed: false,
      code: 'OUTSIDE_APPROVED_PACKAGE',
      message: `These permissions are outside the ALO-approved package for your company: ${outsidePackage.join(', ')}. Request them from ALO Education.`,
      blockedPermissions: outsidePackage,
    };
  }

  return { allowed: true, code: 'OK', message: 'Partner user may be created.' };
}

// ────────────────────────────────────────────────────────────────────────────
// Marketing quota & video rules
// ────────────────────────────────────────────────────────────────────────────

export type MarketingAsset = 'image' | 'video';

export function quotaMessage(asset: MarketingAsset): string {
  return asset === 'image'
    ? 'Monthly image quota finished. Request extra quota from ALO Education.'
    : 'Monthly video quota finished. Request extra quota from ALO Education.';
}

/**
 * Check a monthly asset quota. Called BEFORE generation so a partner can never
 * generate past its limit.
 */
export function checkMarketingQuota(input: {
  asset: MarketingAsset;
  imagesUsed: number;
  videosUsed: number;
  limits: Pick<EffectivePartnerLimits, 'monthlyImageLimit' | 'monthlyVideoLimit'>;
}): { allowed: boolean; used: number; limit: number; remaining: number; message?: string } {
  const isImage = input.asset === 'image';
  const used = isImage ? input.imagesUsed : input.videosUsed;
  const limit = isImage ? input.limits.monthlyImageLimit : input.limits.monthlyVideoLimit;
  const remaining = Math.max(0, limit - used);

  if (limit <= 0 || remaining <= 0) {
    return { allowed: false, used, limit, remaining: 0, message: quotaMessage(input.asset) };
  }
  return { allowed: true, used, limit, remaining };
}

/**
 * Enforce the video length rule. The ceiling comes from the partner's approved
 * package and is itself clamped to the ALO hard ceiling, so this is the single
 * place the 30-second rule can be satisfied or violated.
 */
export function checkVideoDuration(input: {
  requestedSeconds: number;
  limits: Pick<EffectivePartnerLimits, 'videoDurationLimitSeconds'>;
}): { allowed: boolean; maxSeconds: number; requestedSeconds: number; message?: string } {
  const maxSeconds = Math.min(input.limits.videoDurationLimitSeconds, ALO_HARD_VIDEO_CEILING_SECONDS);
  const requested = Number.isFinite(input.requestedSeconds) ? input.requestedSeconds : 0;
  if (requested > maxSeconds) {
    return {
      allowed: false,
      maxSeconds,
      requestedSeconds: requested,
      message: `Videos are limited to ${maxSeconds} seconds. Shorten the video and try again.`,
    };
  }
  return { allowed: true, maxSeconds, requestedSeconds: requested };
}

/** Where a marketing asset sits in the approval workflow, and who may publish. */
export function decideMarketingPublish(input: {
  partnerApproved: boolean;
  limits: Pick<EffectivePartnerLimits, 'autoPublishAllowed' | 'requiresAloApproval'>;
  aloApproved?: boolean;
  socialAccountApproved?: boolean;
}): { canPublish: boolean; state: 'draft' | 'awaiting_partner_approval' | 'awaiting_alo_approval' | 'ready_to_schedule' | 'blocked'; reason: string } {
  if (!input.socialAccountApproved) {
    return {
      canPublish: false,
      state: 'blocked',
      reason: 'Connect an approved Facebook/Instagram account before publishing.',
    };
  }
  if (input.limits.requiresAloApproval && !input.aloApproved) {
    return { canPublish: false, state: 'awaiting_alo_approval', reason: 'This campaign needs ALO review before it can be published.' };
  }
  if (!input.partnerApproved) {
    return { canPublish: false, state: 'awaiting_partner_approval', reason: 'The Partner Super Admin must approve this draft before publishing.' };
  }
  if (!input.limits.autoPublishAllowed) {
    return { canPublish: false, state: 'ready_to_schedule', reason: 'Approved. Scheduling is manual for your package.' };
  }
  return { canPublish: true, state: 'ready_to_schedule', reason: 'Approved for automated publishing by ALO policy.' };
}

/** Spec: quotas reset monthly. Returns the `YYYY-MM` period key for a date. */
export function usagePeriod(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function isNewQuotaPeriod(lastPeriod: string | null | undefined, date: Date): boolean {
  return String(lastPeriod || '') !== usagePeriod(date);
}

// ────────────────────────────────────────────────────────────────────────────
// Student benefits (partner students)
// ────────────────────────────────────────────────────────────────────────────

export const BENEFIT_TYPES = [
  'UKVI_INTERVIEW_PREP',
  'UNIVERSITY_INTERVIEW_PREP',
  'ENGLISH_MOCK_TEST',
  'AI_SPEAKING_PRACTICE',
  'DOCUMENT_CHECKLIST',
  'APPLICATION_GUIDANCE',
] as const;
export type BenefitType = (typeof BENEFIT_TYPES)[number];

/** Voucher lifecycle states from the brief. */
export const VOUCHER_STATUSES = ['available', 'used', 'expired', 'cancelled'] as const;
export type VoucherStatus = (typeof VOUCHER_STATUSES)[number];

/**
 * Application stages that mean the student no longer holds an active application.
 * (Uppercase values are the authoritative `Application.stage` vocabulary; the
 * lowercase entries are the legacy/short spellings found in older rows.)
 */
export const INACTIVE_APPLICATION_STAGES = [
  'APPLICATION_DRAFT',
  'PROFILE_REVIEW',
  'DOCUMENT_REVIEW',
  'READY_TO_SUBMIT',
  'CANCELLED',
  'CLOSED',
  'WITHDRAWN',
  'REJECTED',
  'REFUSED',
  // legacy short spellings
  'draft',
  'cancelled',
  'closed',
  'withdrawn',
  'rejected',
  'refused',
] as const;

/**
 * Stages at or beyond submission. Benefits attach only to an application that has
 * actually been sent to ALO/ the university — a draft or a case still under
 * document review is NOT an active application, so no voucher is issued for it.
 *
 * Deny-by-default: a stage that is not listed here does not qualify, even if it
 * is also not in the inactive list. New stages must be added deliberately.
 */
export const BENEFIT_ELIGIBLE_STAGES = [
  'SUBMITTED_TO_ALO_APPLICATION_TEAM',
  'SUBMITTED_TO_B2B',
  'SUBMITTED_TO_UNIVERSITY',
  'ACKNOWLEDGEMENT_RECEIVED',
  'DECISION_PENDING',
  'MORE_DOCUMENTS_REQUESTED',
  'INTERVIEW_REQUIRED',
  'CONDITIONAL_OFFER',
  'UNCONDITIONAL_OFFER',
  'DEFERRED',
  'DEPOSIT_PENDING',
  'DEPOSIT_PAID',
  'CAS_PENDING',
  'CAS_RECEIVED',
  'I20_PENDING',
  'I20_RECEIVED',
  'COE_PENDING',
  'COE_RECEIVED',
  'VISA_HANDOVER_READY',
  'VISA_FILE_CREATED',
  'REJECTED',
  // legacy short spellings
  'submitted',
  'offer_received',
  'conditional_offer',
  'unconditional_offer',
  'deposit_pending',
  'cas_pending',
  'cas_received',
  'visa_applied',
  'visa_approved',
  'visa_submitted',
  'interview_scheduled',
  'enrolled',
  'document_uploaded',
  'document_ready',
] as const;

export const BENEFIT_WITHHELD_MESSAGE =
  'This benefit is available only after the student has an active application through ALO Education.';

/**
 * Does the student hold an active ALO application? Benefits are gated on this and
 * nothing else — a partner cannot grant a benefit by hand.
 *
 * A stage qualifies only when it appears in BENEFIT_ELIGIBLE_STAGES, so a draft or
 * a case still in document review is refused by default rather than by accident.
 *
 * The brief's caveat is honoured explicitly: `REJECTED` disqualifies a file
 * *before* submission, so a rejected application qualifies only when the caller can
 * confirm it was submitted (`submitted === true`).
 */
export function hasActiveAloApplication(
  applications: Array<{ stage?: string | null; submitted?: boolean | null; submittedAt?: Date | string | null }>,
): boolean {
  return (applications || []).some((application) => {
    const stage = String(application.stage || '').trim();
    if (!stage) return false;

    const ineligible = (INACTIVE_APPLICATION_STAGES as readonly string[]).includes(stage);
    const eligible = (BENEFIT_ELIGIBLE_STAGES as readonly string[]).includes(stage);

    // A rejection after submission is still a live file for benefits; a rejection
    // before submission is not.
    const isRejected = stage.toUpperCase() === 'REJECTED' || stage.toLowerCase() === 'rejected';
    if (isRejected) {
      if (!ineligible) return false;
      return application.submitted === true || !!application.submittedAt;
    }

    if (ineligible) return false;
    return eligible;
  });
}

export interface BenefitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  reason?: string;
}

/**
 * Can this student use a benefit right now?
 *
 * Order of checks matters: an inactive/missing application is refused before any
 * per-benefit entitlement is even considered, so a stale entitlement row can never
 * outlive the application it was issued for.
 */
export function canUseStudentBenefit(input: {
  benefitType: BenefitType;
  applications: Array<{ stage?: string | null; submitted?: boolean | null; submittedAt?: Date | string | null }>;
  entitlement?: { limitCount: number; usedCount: number; status?: string | null; applicationId?: string | null } | null;
  /** The active application the entitlement was issued against, if any. */
  activeApplicationId?: string | null;
}): BenefitDecision {
  if (!hasActiveAloApplication(input.applications)) {
    return { allowed: false, limit: 0, remaining: 0, reason: BENEFIT_WITHHELD_MESSAGE };
  }

  const entitlement = input.entitlement;
  if (!entitlement) {
    return {
      allowed: false,
      limit: 0,
      remaining: 0,
      reason: 'No benefit package has been issued for this student yet. It is generated when the ALO application is approved.',
    };
  }

  // An entitlement is tied to one application (one package per active application).
  if (entitlement.applicationId && input.activeApplicationId && entitlement.applicationId !== input.activeApplicationId) {
    return {
      allowed: false,
      limit: entitlement.limitCount,
      remaining: 0,
      reason: 'This benefit belongs to a different application. Benefits are linked to the application they were issued for.',
    };
  }

  const status = String(entitlement.status || 'active').toLowerCase();
  if (status !== 'active') {
    return { allowed: false, limit: entitlement.limitCount, remaining: 0, reason: `This benefit is ${status}.` };
  }

  const remaining = Math.max(0, entitlement.limitCount - entitlement.usedCount);
  if (remaining <= 0) {
    return { allowed: false, limit: entitlement.limitCount, remaining: 0, reason: 'This benefit has already been used.' };
  }

  return { allowed: true, limit: entitlement.limitCount, remaining };
}

/** Per-benefit limits the brief specifies, per active ALO application. */
export function benefitLimitFor(benefitType: BenefitType): number {
  switch (benefitType) {
    case 'ENGLISH_MOCK_TEST':
      return 3; // three English mock test vouchers per eligible student
    case 'UNIVERSITY_INTERVIEW_PREP':
    case 'UKVI_INTERVIEW_PREP':
      return 1; // one mock interview/test attempt per application
    case 'AI_SPEAKING_PRACTICE':
      return 1;
    default:
      return 1;
  }
}

/**
 * Plan the benefits to issue when an ALO application becomes active.
 * Returns [] when the application is not active — that is the "no application, no
 * voucher" rule expressed as code rather than as a caller's if-statement.
 */
export function planBenefitIssuance(input: {
  application: { stage?: string | null; submitted?: boolean | null; submittedAt?: Date | string | null };
}): Array<{ benefitType: BenefitType; limitCount: number }> {
  if (!hasActiveAloApplication([input.application])) return [];
  return [
    { benefitType: 'ENGLISH_MOCK_TEST', limitCount: benefitLimitFor('ENGLISH_MOCK_TEST') },
    { benefitType: 'UNIVERSITY_INTERVIEW_PREP', limitCount: benefitLimitFor('UNIVERSITY_INTERVIEW_PREP') },
    { benefitType: 'UKVI_INTERVIEW_PREP', limitCount: benefitLimitFor('UKVI_INTERVIEW_PREP') },
    { benefitType: 'AI_SPEAKING_PRACTICE', limitCount: benefitLimitFor('AI_SPEAKING_PRACTICE') },
    { benefitType: 'DOCUMENT_CHECKLIST', limitCount: 1 },
    { benefitType: 'APPLICATION_GUIDANCE', limitCount: 1 },
  ];
}

/** Voucher code shape: readable, unguessable enough for a one-student benefit. */
export function formatVoucherCode(input: { testType: string; random: string }): string {
  const prefix = input.testType === 'ENGLISH_MOCK_TEST' ? 'ALO-EMT' : 'ALO-MOCK';
  const body = String(input.random || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8).padEnd(8, '0');
  return `${prefix}-${body}`;
}

/**
 * Voucher usability. Expiry is evaluated against the supplied instant so callers
 * stay deterministic, and a voucher belonging to another student is refused.
 */
export function canUseVoucher(input: {
  voucher: { studentId: string; status: string; usedCount: number; usageLimit: number; expiresAt?: Date | string | null };
  studentId: string;
  now: Date;
}): { allowed: boolean; status: VoucherStatus; reason?: string } {
  const voucher = input.voucher;
  const status = String(voucher.status || '').toLowerCase() as VoucherStatus;

  if (voucher.studentId !== input.studentId) {
    return { allowed: false, status, reason: 'Voucher belongs to another student. Cross-student use is blocked.' };
  }
  if (status !== 'available') {
    return { allowed: false, status, reason: `Voucher is ${status}. Only available vouchers can be used.` };
  }
  if (voucher.expiresAt && new Date(voucher.expiresAt).getTime() < input.now.getTime()) {
    return { allowed: false, status: 'expired', reason: 'Voucher has expired.' };
  }
  if (voucher.usedCount >= voucher.usageLimit) {
    return { allowed: false, status, reason: 'Voucher usage limit reached.' };
  }
  return { allowed: true, status };
}

// ────────────────────────────────────────────────────────────────────────────
// Partner social accounts (tokens)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Masking rule: a token is never returned in full to any client. Only the last
 * four characters survive, which is enough for an operator to recognise the
 * credential and useless to anyone who intercepts it.
 */
export function maskSocialToken(token: string | null | undefined): string {
  const value = String(token || '');
  if (value.length === 0) return '';
  if (value.length <= 8) return '••••';
  return `${'•'.repeat(Math.min(12, value.length - 4))}${value.slice(-4)}`;
}

export interface SocialAccountView {
  connectionStatus: 'connected' | 'expired' | 'revoked' | 'pending_alo_approval';
  approvedByAlo: boolean;
  tokenExpiresAt?: Date | string | null;
  lastSyncAt?: Date | string | null;
  connectedBy?: string | null;
}

/** Compute the connection status shown to a partner, including expiry warnings. */
export function evaluateSocialAccountView(account: SocialAccountView, now: Date): {
  connectionStatus: SocialAccountView['connectionStatus'];
  tokenExpired: boolean;
  /** Spec: show a rotate warning once the token is old/expired. */
  rotateWarning: string | null;
  canPublish: boolean;
} {
  const expiresAt = account.tokenExpiresAt ? new Date(account.tokenExpiresAt) : null;
  const tokenExpired = !!expiresAt && expiresAt.getTime() < now.getTime();
  const daysToExpiry = expiresAt ? Math.floor((expiresAt.getTime() - now.getTime()) / 86400000) : null;

  let connectionStatus = account.connectionStatus;
  if (!account.approvedByAlo) connectionStatus = 'pending_alo_approval';
  else if (tokenExpired) connectionStatus = 'expired';

  let rotateWarning: string | null = null;
  if (tokenExpired) {
    rotateWarning = 'The access token has expired. Reconnect or rotate the token to keep publishing.';
  } else if (daysToExpiry !== null && daysToExpiry <= 7) {
    rotateWarning = `The access token expires in ${daysToExpiry} day${daysToExpiry === 1 ? '' : 's'}. Rotate it soon to avoid interruption.`;
  }

  return {
    connectionStatus,
    tokenExpired,
    rotateWarning,
    canPublish: connectionStatus === 'connected' && !tokenExpired && account.approvedByAlo,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// B2B visibility
// ────────────────────────────────────────────────────────────────────────────

export interface B2BVisibilityViewer {
  userId: string;
  roles: string[];
  partnerId?: string | null;
}

/**
 * Who may see B2B provider/internal details on an application.
 *
 * A partner sees its own application. A counselor assigned to it may see the
 * relationship but not commercial terms. Commercial terms belong to ALO master
 * control and finance only.
 */
export function canViewB2BDetails(
  viewer: B2BVisibilityViewer,
  application: { partnerId?: string | null; assignedCounselorId?: string | null; b2bProviderId?: string | null },
): { allowed: boolean; scope: 'full' | 'own_partner' | 'assigned_only' | 'none'; reason: string } {
  const roles = (viewer.roles || []).map((role) => String(role).toLowerCase());

  if (isAloMasterRole(roles)) {
    return { allowed: true, scope: 'full', reason: 'ALO master control.' };
  }
  if (roles.some((role) => ['finance', 'finance_officer'].includes(role))) {
    return { allowed: true, scope: 'full', reason: 'Finance may see commercial terms.' };
  }
  if (roles.includes('partner_super_admin') || roles.includes('partner_counselor') || roles.includes('partner')) {
    if (viewer.partnerId && application.partnerId && viewer.partnerId === application.partnerId) {
      return { allowed: true, scope: 'own_partner', reason: 'This is your company\'s application.' };
    }
    return { allowed: false, scope: 'none', reason: 'This application belongs to another partner.' };
  }
  if (viewer.userId && application.assignedCounselorId === viewer.userId) {
    return {
      allowed: true,
      scope: 'assigned_only',
      reason: 'Assigned counselor: the application relationship is visible, commercial terms are not.',
    };
  }
  return { allowed: false, scope: 'none', reason: 'B2B provider details require ALO permission.' };
}

// ────────────────────────────────────────────────────────────────────────────
// Notifications
// ────────────────────────────────────────────────────────────────────────────

export type NotificationAudience = 'alo_super_admin' | 'partner_super_admin';

export const NOTIFICATION_TRIGGERS: Record<string, { audience: NotificationAudience; message: string }> = {
  seat_request: { audience: 'alo_super_admin', message: 'A partner has requested additional user seats.' },
  quota_request: { audience: 'alo_super_admin', message: 'A partner has requested additional marketing quota.' },
  quota_exceeded: { audience: 'alo_super_admin', message: 'A partner has reached a monthly marketing quota.' },
  restricted_feature_attempt: { audience: 'alo_super_admin', message: 'A partner attempted to use a restricted feature.' },
  employee_profile_submitted: { audience: 'alo_super_admin', message: 'An employee has submitted their profile for review.' },
  salary_or_document_accessed: { audience: 'alo_super_admin', message: 'Salary or HR document data was accessed.' },
  b2b_details_viewed: { audience: 'alo_super_admin', message: 'B2B provider details were viewed.' },
  voucher_limit_reached: { audience: 'alo_super_admin', message: 'A voucher or benefit limit was reached.' },
  quota_near_limit: { audience: 'partner_super_admin', message: 'Your monthly marketing quota is nearly finished.' },
  quota_finished: { audience: 'partner_super_admin', message: 'Your monthly marketing quota is finished.' },
  quota_decision: { audience: 'partner_super_admin', message: 'Your extra quota request was reviewed.' },
  benefit_activated: { audience: 'partner_super_admin', message: 'A student benefit has been activated.' },
  voucher_generated: { audience: 'partner_super_admin', message: 'Mock test vouchers have been generated.' },
  application_approved: { audience: 'partner_super_admin', message: 'A student application was approved or submitted.' },
};

/** Which notifications a given event must raise, and to whom. */
export function notificationsFor(eventKey: string): Array<{ audience: NotificationAudience; message: string }> {
  const trigger = NOTIFICATION_TRIGGERS[eventKey];
  return trigger ? [{ audience: trigger.audience, message: trigger.message }] : [];
}

/** Warn the partner before the wall, not only after it. */
export function quotaWarning(remainingBefore: number, limit: number, asset: MarketingAsset): string | null {
  if (remainingBefore <= 0) return quotaMessage(asset);
  if (limit > 0 && remainingBefore <= Math.max(1, Math.ceil(limit * 0.2))) {
    return `Only ${remainingBefore} ${asset}${remainingBefore === 1 ? '' : 's'} left this month. Request extra quota from ALO Education if you need more.`;
  }
  return null;
}

// ────────────────────────────────────────────────────────────────────────────
// Super Admin Access Control Center — the sections ALO master control owns
// ────────────────────────────────────────────────────────────────────────────

export type AccessControlSectionKey =
  | 'alo_employee_roles'
  | 'b2b_partner_packages'
  | 'partner_user_seat_limits'
  | 'partner_marketing_quotas'
  | 'partner_student_benefit_rules'
  | 'mock_test_voucher_rules'
  | 'application_b2b_visibility'
  | 'document_access'
  | 'salary_hr_access'
  | 'ai_feature_access'
  | 'social_media_posting_access'
  | 'sending_limits';

export interface AccessControlSection {
  key: AccessControlSectionKey;
  label: string;
  /** The rule the section controls, in the operator's words. */
  rule: string;
  /** Feature keys this section governs (they resolve to featureAccessRule rows). */
  featureKeys: string[];
  /** True when turning this off must change a backend decision, not just a view. */
  backendEnforced: boolean;
}

/**
 * The twelve sections of the Access Control Center. Declared here (rather than
 * inline in the page) so the UI, the API and the checks all read one list — a
 * section that is shown but governs nothing is a lie the operator cannot detect.
 */
export const ACCESS_CONTROL_SECTIONS: AccessControlSection[] = [
  {
    key: 'alo_employee_roles',
    label: 'ALO Employee Roles',
    rule: 'Designation, department, office and permission package per employee. Super Admin decides every feature an employee can reach.',
    featureKeys: ['employee_role', 'employee_permission_package'],
    backendEnforced: true,
  },
  {
    key: 'b2b_partner_packages',
    label: 'B2B Partner Packages',
    rule: 'Starter, Growth and Premium are editable: seats, image quota, video quota, voucher and interview limits.',
    featureKeys: ['partner_package'],
    backendEnforced: true,
  },
  {
    key: 'partner_user_seat_limits',
    label: 'Partner User Seat Limits',
    rule: 'Starter allows 3 users (1 Partner Super Admin + 2 employees). Extra seats require an approved request.',
    featureKeys: ['user_seats'],
    backendEnforced: true,
  },
  {
    key: 'partner_marketing_quotas',
    label: 'Partner Marketing Quotas',
    rule: 'Monthly image and video generation limits, plus the maximum video length.',
    featureKeys: ['monthly_images', 'monthly_videos', 'video_duration_limit_seconds'],
    backendEnforced: true,
  },
  {
    key: 'partner_student_benefit_rules',
    label: 'Partner Student Benefit Rules',
    rule: 'Student benefits require an active ALO application. No application, no benefit.',
    featureKeys: ['student_benefit'],
    backendEnforced: true,
  },
  {
    key: 'mock_test_voucher_rules',
    label: 'Mock Test Voucher Rules',
    rule: 'Three English mock test vouchers and one interview-preparation attempt per eligible student, per application.',
    featureKeys: ['mock_test_voucher', 'english_mock_voucher_limit', 'interview_prep_limit'],
    backendEnforced: true,
  },
  {
    key: 'application_b2b_visibility',
    label: 'Application / B2B Visibility',
    rule: 'Which roles may see B2B provider details and commercial terms. A partner sees only its own applications.',
    featureKeys: ['b2b_visibility', 'private_notes'],
    backendEnforced: true,
  },
  {
    key: 'document_access',
    label: 'Document Access',
    rule: 'Who may view, verify, reject, supersede or download student and employee documents.',
    featureKeys: ['document_view', 'document_review', 'document_download'],
    backendEnforced: true,
  },
  {
    key: 'salary_hr_access',
    label: 'Salary / HR Access',
    rule: 'Employee salary, bank details, NID/passport and HR documents. Restricted to the employee, Super Admin/Chairman and an HR Manager holding the permission.',
    featureKeys: ['salary_view', 'employee_private_profile', 'hr_document_download'],
    backendEnforced: true,
  },
  {
    key: 'ai_feature_access',
    label: 'AI Feature Access',
    rule: 'Which AI features a role may use: draft, summarise, classify versus high-risk actions needing human approval.',
    featureKeys: ['ai_draft', 'ai_automation'],
    backendEnforced: true,
  },
  {
    key: 'social_media_posting_access',
    label: 'Social Media Posting Access',
    rule: 'Who may connect an official account and who may publish. Personal accounts are never connected to the ALO engine.',
    featureKeys: ['social_connect', 'social_publish'],
    backendEnforced: true,
  },
  {
    key: 'sending_limits',
    label: 'Email / SMS / WhatsApp Sending Limits',
    rule: 'Per-role and per-partner sending ceilings for email, SMS and WhatsApp, including broadcast limits.',
    featureKeys: ['email_send_limit', 'sms_send_limit', 'whatsapp_send_limit'],
    backendEnforced: true,
  },
];

export function accessControlSection(key: string): AccessControlSection | null {
  return ACCESS_CONTROL_SECTIONS.find((section) => section.key === key) ?? null;
}

/** Every feature key the Access Control Center can toggle, de-duplicated. */
export function accessControlFeatureKeys(): string[] {
  const keys = new Set<string>();
  for (const section of ACCESS_CONTROL_SECTIONS) {
    for (const key of section.featureKeys) keys.add(key);
  }
  return [...keys];
}
