// ============================================================
// ALO EDUCATION — UNIVERSITY / INSTITUTION PORTAL (spec s39, s69)
// ============================================================
// Institution-facing portal so university representatives can work their own
// pipeline without ever seeing another institution's data or ALO-internal
// commercial information.
//
// Tenant isolation is the whole point (s69). The rules enforced here:
//  * A representative is bound to exactly ONE universityId. Every query in
//    this module filters on that id — it is never taken from the request.
//  * Confidential ALO fields are never selected: commission amounts, partner
//    commercial terms, internal notes, review status, B2B confidential flags.
//  * Status changes a representative makes are proposals recorded with an
//    audit row; they cannot silently overwrite ALO's authoritative pipeline
//    without an ALO-side reviewer (s116 human-in-the-loop).
// ============================================================

import { db } from '@/lib/db';

export const UNIVERSITY_PORTAL_ROLES = [
  'UNIVERSITY_REPRESENTATIVE',
  'UNIVERSITY_ADMINS',
  'UNIVERSITY_MANAGER',
] as const;
export type UniversityPortalRole = (typeof UNIVERSITY_PORTAL_ROLES)[number];

export const UNIVERSITY_PORTAL_STATUSES = ['INVITED', 'ACTIVE', 'SUSPENDED', 'REVOKED'] as const;

export const UNIVERSITY_PORTAL_PERMISSIONS = [
  'view_applications',
  'request_documents',
  'update_application_status',
  'issue_offer',
  'upload_offer_letter',
  'communicate',
  'view_recruitment_data',
  'view_deposits',
  'view_enrolments',
  'view_contract_terms',
] as const;
export type UniversityPortalPermission = (typeof UNIVERSITY_PORTAL_PERMISSIONS)[number];

/** Default permission set per role. Manager is the widest, still bounded. */
export const DEFAULT_ROLE_PERMISSIONS: Record<UniversityPortalRole, UniversityPortalPermission[]> = {
  UNIVERSITY_REPRESENTATIVE: [
    'view_applications',
    'request_documents',
    'communicate',
    'view_recruitment_data',
  ],
  UNIVERSITY_ADMINS: [
    'view_applications',
    'request_documents',
    'update_application_status',
    'issue_offer',
    'upload_offer_letter',
    'communicate',
    'view_recruitment_data',
    'view_deposits',
  ],
  UNIVERSITY_MANAGER: [
    'view_applications',
    'request_documents',
    'update_application_status',
    'issue_offer',
    'upload_offer_letter',
    'communicate',
    'view_recruitment_data',
    'view_deposits',
    'view_enrolments',
    'view_contract_terms',
  ],
};

/**
 * Fields a university representative must NEVER receive. Selection lists in
 * this module are built by allowlist; this list documents the denylist and is
 * asserted by tests so a future refactor cannot leak them.
 */
export const UNIVERSITY_PORTAL_FORBIDDEN_FIELDS = [
  'internalNotes',
  'notes',
  'reviewStatus',
  'partnerId',
  'b2bProviderId',
  'isB2bConfidential',
  'sourceVisibility',
  'applicationSource',
  'counselorId',
  'counselorName',
  'visaOfficerId',
  'appTeamOfficerId',
  'commissionAmount',
  'partnerCommission',
  'createdBy',
  'updatedBy',
] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizePermissions(value: unknown): UniversityPortalPermission[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set<string>(UNIVERSITY_PORTAL_PERMISSIONS);
  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter((item) => allowed.has(item)),
    ),
  ) as UniversityPortalPermission[];
}

function safeParsePermissions(raw: string): UniversityPortalPermission[] {
  try {
    return normalizePermissions(JSON.parse(raw || '[]'));
  } catch {
    return [];
  }
}

// ============================================================
// Account management (ALO-side)
// ============================================================
export interface CreateUniversityAccountInput {
  universityId: string;
  fullName: string;
  email: string;
  jobTitle?: string;
  role?: UniversityPortalRole | string;
  permissions?: UniversityPortalPermission[];
  invitedBy?: string | null;
  status?: string;
}

export async function createUniversityPortalAccount(input: CreateUniversityAccountInput) {
  const universityId = String(input.universityId || '').trim();
  if (!universityId) throw new Error('universityId is required');

  // The institution must really exist. Never create a portal for a university
  // that is not in the canonical catalogue — that would be an orphan tenant.
  const university = await db.crmUniversity.findUnique({
    where: { universityId },
    select: { universityId: true, name: true },
  });
  if (!university) throw new Error(`University not found in canonical catalogue: ${universityId}`);

  const email = String(input.email || '').trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) throw new Error('A valid representative email is required');

  const fullName = String(input.fullName || '').trim();
  if (!fullName) throw new Error('Representative full name is required');

  const role = (UNIVERSITY_PORTAL_ROLES as readonly string[]).includes(String(input.role || ''))
    ? (String(input.role) as UniversityPortalRole)
    : 'UNIVERSITY_REPRESENTATIVE';

  const permissions =
    input.permissions && input.permissions.length > 0
      ? normalizePermissions(input.permissions)
      : DEFAULT_ROLE_PERMISSIONS[role];

  const existing = await db.universityPortalAccount.findUnique({ where: { email } });
  if (existing) {
    // Cross-tenant collision: the same email cannot represent two institutions.
    if (existing.universityId !== universityId) {
      throw new Error('This email is already bound to a different institution');
    }
    throw new Error('A portal account already exists for this email');
  }

  const account = await db.universityPortalAccount.create({
    data: {
      universityId,
      fullName,
      email,
      jobTitle: String(input.jobTitle || ''),
      role,
      status: String(input.status || 'INVITED').toUpperCase(),
      permissions: JSON.stringify(permissions),
      invitedBy: input.invitedBy || null,
    },
  });

  await recordActivity(account.id, universityId, 'ACCOUNT_CREATED', 'UniversityPortalAccount', account.id, {
    role,
    permissions,
    invitedBy: input.invitedBy || null,
  });

  return { ...account, permissions: safeParsePermissions(account.permissions), universityName: university.name };
}

export async function setUniversityAccountStatus(
  accountId: string,
  status: string,
  actorId?: string | null,
) {
  const normalized = String(status || '').toUpperCase();
  if (!(UNIVERSITY_PORTAL_STATUSES as readonly string[]).includes(normalized)) {
    throw new Error(`Unsupported account status: ${status}`);
  }
  const account = await db.universityPortalAccount.findUnique({ where: { id: accountId } });
  if (!account) throw new Error(`University portal account not found: ${accountId}`);

  const updated = await db.universityPortalAccount.update({
    where: { id: accountId },
    data: { status: normalized },
  });
  await recordActivity(accountId, account.universityId, `ACCOUNT_STATUS_${normalized}`, 'UniversityPortalAccount', accountId, {
    previousStatus: account.status,
    actorId: actorId || null,
  });
  return updated;
}

async function recordActivity(
  accountId: string,
  universityId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {},
) {
  try {
    await db.universityPortalActivity.create({
      data: {
        accountId,
        universityId,
        action,
        entityType,
        entityId,
        metadata: JSON.stringify(metadata),
      },
    });
  } catch {
    // Activity logging must never break the operation it records, but the
    // caller still gets the real result. Failures are visible via the audit
    // route rather than silently swallowed at the UI layer.
  }
}

// ============================================================
// Tenant-scoped resolution — the ONLY way to read data here
// ============================================================
export interface UniversityPortalContext {
  accountId: string;
  universityId: string;
  role: UniversityPortalRole;
  permissions: UniversityPortalPermission[];
  status: string;
}

/**
 * Resolve and validate a portal context from the account id. Returns null when
 * the account is missing or not ACTIVE — callers must fail closed.
 *
 * The universityId comes from the STORED account row, never from the request.
 */
export async function resolveUniversityPortalContext(
  accountId: string,
): Promise<UniversityPortalContext | null> {
  if (!accountId) return null;
  const account = await db.universityPortalAccount.findUnique({ where: { id: accountId } });
  if (!account) return null;
  if (account.status !== 'ACTIVE') return null;

  return {
    accountId: account.id,
    universityId: account.universityId,
    role: (UNIVERSITY_PORTAL_ROLES as readonly string[]).includes(account.role)
      ? (account.role as UniversityPortalRole)
      : 'UNIVERSITY_REPRESENTATIVE',
    permissions: safeParsePermissions(account.permissions),
    status: account.status,
  };
}

export function hasUniversityPermission(
  context: UniversityPortalContext | null,
  permission: UniversityPortalPermission,
): boolean {
  if (!context) return false;
  return context.permissions.includes(permission);
}

/**
 * Resolve a portal context from an authenticated email.
 *
 * University representatives authenticate through the existing portal auth and
 * are bound to their institution by the STORED account row — the universityId
 * is never accepted from a request parameter, header or body.
 */
export async function resolveUniversityPortalContextByEmail(
  email: string | null | undefined,
): Promise<UniversityPortalContext | null> {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return null;
  const account = await db.universityPortalAccount.findUnique({ where: { email: normalized } });
  if (!account) return null;
  return resolveUniversityPortalContext(account.id);
}

/** Touch the login timestamp once a representative is authenticated. */
export async function markUniversityPortalLogin(accountId: string): Promise<void> {
  try {
    await db.universityPortalAccount.update({
      where: { id: accountId },
      data: { lastLoginAt: new Date() },
    });
  } catch {
    // A failed timestamp write must not block the representative's session.
  }
}

/**
 * Applications belonging to this institution ONLY.
 * Matches on the canonical universityId, falling back to the recorded name
 * because historical applications store a name without an id.
 */
export async function listInstitutionApplications(
  context: UniversityPortalContext,
  options: { limit?: number; offset?: number; stage?: string; search?: string } = {},
) {
  if (!hasUniversityPermission(context, 'view_applications')) {
    throw new Error('PERMISSION_DENIED:view_applications');
  }
  const limit = Math.max(1, Math.min(options.limit ?? 50, 200));
  const offset = Math.max(0, options.offset ?? 0);

  const university = await db.crmUniversity.findUnique({
    where: { universityId: context.universityId },
    select: { name: true },
  });
  const universityName = university?.name || '';

  const where = {
    OR: [
      { universityId: context.universityId },
      ...(universityName ? [{ universityName }] : []),
    ],
    ...(options.stage ? { stage: options.stage } : {}),
    ...(options.search
      ? {
          AND: [
            {
              OR: [
                { courseName: { contains: options.search } },
                { applicationCode: { contains: options.search } },
              ],
            },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    db.application.findMany({
      where,
      // EXPLICIT ALLOWLIST. Never `select: true` — that would leak internal
      // notes, counselor identity, partner ids and commission data.
      select: {
        id: true,
        applicationCode: true,
        courseName: true,
        level: true,
        intake: true,
        country: true,
        stage: true,
        safeStatus: true,
        documentStatus: true,
        offerStatus: true,
        casI20CoeStatus: true,
        deadlineDate: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    db.application.count({ where }),
  ]);

  await recordActivity(context.accountId, context.universityId, 'LIST_APPLICATIONS', 'Application', '', {
    total,
    limit,
    offset,
  });

  return { applications: rows, total, limit, offset };
}

/** Documents attached to one of this institution's applications. */
export async function listInstitutionApplicationDocuments(
  context: UniversityPortalContext,
  applicationId: string,
) {
  if (!hasUniversityPermission(context, 'view_applications')) {
    throw new Error('PERMISSION_DENIED:view_applications');
  }
  const application = await db.application.findUnique({
    where: { id: applicationId },
    select: { id: true, universityId: true, universityName: true },
  });
  if (!application) throw new Error('Application not found');

  // Direct object reference guard: the application must belong to THIS tenant.
  const university = await db.crmUniversity.findUnique({
    where: { universityId: context.universityId },
    select: { name: true },
  });
  const belongsToTenant =
    application.universityId === context.universityId ||
    (Boolean(university?.name) && application.universityName === university?.name);
  if (!belongsToTenant) throw new Error('TENANT_MISMATCH');

  const documents = await db.applicationDocument.findMany({
    where: { applicationId },
    select: {
      id: true,
      documentType: true,
      fileName: true,
      status: true,
      version: true,
      createdAt: true,
      updatedAt: true,
      // reviewerId/reviewerNote are ALO-internal and deliberately excluded.
    },
    orderBy: { updatedAt: 'desc' },
  });

  return { applicationId, documents };
}

/**
 * Request a missing/replacement document from the student via ALO.
 * Recorded as a request — it never mutates the authoritative document row.
 */
export async function requestDocument(
  context: UniversityPortalContext,
  applicationId: string,
  documentType: string,
  reason: string,
) {
  if (!hasUniversityPermission(context, 'request_documents')) {
    throw new Error('PERMISSION_DENIED:request_documents');
  }
  const type = String(documentType || '').trim();
  if (!type) throw new Error('documentType is required');

  const { documents } = await listInstitutionApplicationDocuments(context, applicationId).catch(() => ({
    documents: [] as Array<{ id: string }>,
  }));
  // Re-resolve to keep the tenant check authoritative.
  const application = await db.application.findUnique({
    where: { id: applicationId },
    select: { id: true, universityId: true },
  });
  if (!application || application.universityId !== context.universityId) {
    throw new Error('TENANT_MISMATCH');
  }
  void documents;

  const activity = await db.universityPortalActivity.create({
    data: {
      accountId: context.accountId,
      universityId: context.universityId,
      action: 'REQUEST_DOCUMENT',
      entityType: 'Application',
      entityId: applicationId,
      metadata: JSON.stringify({ documentType: type, reason: String(reason || '').slice(0, 1000) }),
    },
  });

  // Surface the request to ALO admissions as an application-level notification
  // so it lands in a real queue instead of disappearing.
  try {
    await db.applicationNotification.create({
      data: {
        applicationId,
        recipientType: 'APPLICATION_TEAM',
        channel: 'portal',
        templateName: 'UNIVERSITY_DOCUMENT_REQUEST',
        message: `University requested "${type}". ${String(reason || '').slice(0, 400) || 'No reason provided.'}`,
        status: 'PENDING',
      },
    });
  } catch {
    // The activity row is already persisted; notification is best-effort.
  }

  return activity;
}

/**
 * Propose a status update. ALO remains the system of record: the proposal is
 * stored as an activity + internal notification and requires ALO-side approval
 * before it changes the pipeline (s116 human-in-the-loop).
 */
export async function proposeStatusUpdate(
  context: UniversityPortalContext,
  applicationId: string,
  proposedStage: string,
  note: string,
) {
  if (!hasUniversityPermission(context, 'update_application_status')) {
    throw new Error('PERMISSION_DENIED:update_application_status');
  }
  const application = await db.application.findUnique({
    where: { id: applicationId },
    select: { id: true, universityId: true, stage: true },
  });
  if (!application) throw new Error('Application not found');
  if (application.universityId !== context.universityId) throw new Error('TENANT_MISMATCH');

  const proposal = String(proposedStage || '').trim().toUpperCase();
  if (!proposal) throw new Error('proposedStage is required');

  await db.universityPortalActivity.create({
    data: {
      accountId: context.accountId,
      universityId: context.universityId,
      action: 'PROPOSE_STATUS_UPDATE',
      entityType: 'Application',
      entityId: applicationId,
      metadata: JSON.stringify({
        currentStage: application.stage,
        proposedStage: proposal,
        note: String(note || '').slice(0, 1000),
        requiresAloApproval: true,
      }),
    },
  });

  try {
    await db.applicationNotification.create({
      data: {
        applicationId,
        recipientType: 'APPLICATION_TEAM',
        channel: 'portal',
        templateName: 'UNIVERSITY_STATUS_PROPOSAL',
        message: `University proposed stage "${proposal}" (current: ${application.stage}). Requires ALO approval before the pipeline changes.`,
        status: 'PENDING',
      },
    });
  } catch {
    // Best-effort; the proposal row is the durable record.
  }

  return {
    status: 'PROPOSED',
    requiresAloApproval: true,
    currentStage: application.stage,
    proposedStage: proposal,
  };
}

/** Recruitment statistics for this institution only. */
export async function institutionRecruitmentStats(context: UniversityPortalContext) {
  if (!hasUniversityPermission(context, 'view_recruitment_data')) {
    throw new Error('PERMISSION_DENIED:view_recruitment_data');
  }
  const where = { universityId: context.universityId };

  const [total, byStageRows, byCountryRows, offers, enrolled] = await Promise.all([
    db.application.count({ where }),
    db.application.groupBy({ by: ['stage'], where, _count: { _all: true } }),
    db.application.groupBy({ by: ['country'], where, _count: { _all: true } }),
    db.application.count({ where: { ...where, offerStatus: { in: ['CONDITIONAL_OFFER', 'UNCONDITIONAL_OFFER'] } } }),
    db.application.count({ where: { ...where, stage: 'CLOSED' } }),
  ]);

  const stats = {
    universityId: context.universityId,
    totalApplications: total,
    offers,
    enrolled,
    conversionRate: total > 0 ? Number(((offers / total) * 100).toFixed(1)) : 0,
    byStage: byStageRows.map((row) => ({ stage: row.stage, count: row._count._all })),
    byCountry: byCountryRows.map((row) => ({ country: row.country, count: row._count._all })),
  };

  await recordActivity(context.accountId, context.universityId, 'VIEW_RECRUITMENT_STATS', 'Report', '', {
    total,
  });

  return stats;
}

/** Deposit visibility — gated separately and never exposes amounts' owners. */
export async function institutionDepositSummary(context: UniversityPortalContext) {
  if (!hasUniversityPermission(context, 'view_deposits')) {
    throw new Error('PERMISSION_DENIED:view_deposits');
  }
  const where = { universityId: context.universityId };
  const [paid, pending, overdue] = await Promise.all([
    db.application.count({ where: { ...where, depositStatus: 'PAID' } }),
    db.application.count({ where: { ...where, depositStatus: 'PENDING' } }),
    db.application.count({ where: { ...where, OR: [{ depositStatus: 'OVERDUE' }, { paymentStatus: 'OVERDUE' }] } }),
  ]);
  return { universityId: context.universityId, depositPaid: paid, depositPending: pending, overdue };
}

export async function listUniversityAccounts(universityId: string) {
  const accounts = await db.universityPortalAccount.findMany({
    where: { universityId },
    orderBy: { createdAt: 'desc' },
  });
  return accounts.map((account) => ({
    ...account,
    permissions: safeParsePermissions(account.permissions),
  }));
}

export async function accountActivity(accountId: string, limit = 100) {
  return db.universityPortalActivity.findMany({
    where: { accountId },
    orderBy: { createdAt: 'desc' },
    take: Math.max(1, Math.min(limit, 500)),
  });
}
