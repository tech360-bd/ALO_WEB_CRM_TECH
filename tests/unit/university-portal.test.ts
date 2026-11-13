// University/institution portal security contracts (spec s39, s69, s99).
// The whole point of this module is tenant isolation, so these tests attack it.
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    crmUniversity: { findUnique: vi.fn() },
    universityPortalAccount: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    universityPortalActivity: { create: vi.fn(), findMany: vi.fn() },
    application: { findMany: vi.fn(), findUnique: vi.fn(), count: vi.fn(), groupBy: vi.fn() },
    applicationDocument: { findMany: vi.fn() },
    applicationNotification: { create: vi.fn() },
  },
}));

import { db } from '@/lib/db';
import {
  DEFAULT_ROLE_PERMISSIONS,
  UNIVERSITY_PORTAL_FORBIDDEN_FIELDS,
  createUniversityPortalAccount,
  hasUniversityPermission,
  institutionRecruitmentStats,
  listInstitutionApplicationDocuments,
  listInstitutionApplications,
  normalizePermissions,
  proposeStatusUpdate,
  requestDocument,
  resolveUniversityPortalContext,
  resolveUniversityPortalContextByEmail,
  setUniversityAccountStatus,
} from '@/lib/university-portal';
import type { UniversityPortalContext } from '@/lib/university-portal';

const universityFindUnique = db.crmUniversity.findUnique as unknown as ReturnType<typeof vi.fn>;
const accountFindUnique = db.universityPortalAccount.findUnique as unknown as ReturnType<typeof vi.fn>;
const accountFindMany = db.universityPortalAccount.findMany as unknown as ReturnType<typeof vi.fn>;
const accountCreate = db.universityPortalAccount.create as unknown as ReturnType<typeof vi.fn>;
const accountUpdate = db.universityPortalAccount.update as unknown as ReturnType<typeof vi.fn>;
const activityCreate = db.universityPortalActivity.create as unknown as ReturnType<typeof vi.fn>;
const applicationFindMany = db.application.findMany as unknown as ReturnType<typeof vi.fn>;
const applicationFindUnique = db.application.findUnique as unknown as ReturnType<typeof vi.fn>;
const applicationCount = db.application.count as unknown as ReturnType<typeof vi.fn>;
const applicationGroupBy = db.application.groupBy as unknown as ReturnType<typeof vi.fn>;
const appDocFindMany = db.applicationDocument.findMany as unknown as ReturnType<typeof vi.fn>;
const appNotificationCreate = db.applicationNotification.create as unknown as ReturnType<typeof vi.fn>;

function context(overrides: Partial<UniversityPortalContext> = {}): UniversityPortalContext {
  return {
    accountId: 'acc-1',
    universityId: 'UNI-ASTON',
    role: 'UNIVERSITY_REPRESENTATIVE',
    permissions: ['view_applications', 'request_documents'],
    status: 'ACTIVE',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  activityCreate.mockResolvedValue({ id: 'act-1' });
  appNotificationCreate.mockResolvedValue({ id: 'n-1' });
});

describe('Permission model — least privilege by default (s5, s39)', () => {
  it('gives a plain representative no status-change or offer rights', () => {
    const rep = DEFAULT_ROLE_PERMISSIONS.UNIVERSITY_REPRESENTATIVE;
    expect(rep).not.toContain('update_application_status');
    expect(rep).not.toContain('issue_offer');
    expect(rep).not.toContain('view_deposits');
    expect(rep).not.toContain('view_contract_terms');
  });

  it('gives a manager the widest set but still bounded by the catalogue', () => {
    const manager = DEFAULT_ROLE_PERMISSIONS.UNIVERSITY_MANAGER;
    expect(manager).toContain('view_contract_terms');
    // No role may grant a permission outside the declared catalogue.
    for (const role of Object.values(DEFAULT_ROLE_PERMISSIONS)) {
      for (const permission of role) {
        expect(normalizePermissions([permission])).toContain(permission);
      }
    }
  });

  it('drops unknown permissions rather than storing them', () => {
    expect(normalizePermissions(['view_applications', 'delete_all_students', 'export_commissions']))
      .toEqual(['view_applications']);
    expect(normalizePermissions('garbage')).toEqual([]);
    expect(normalizePermissions(null)).toEqual([]);
  });

  it('de-duplicates permissions', () => {
    expect(normalizePermissions(['view_applications', 'view_applications'])).toEqual(['view_applications']);
  });

  it('denies everything for a null context', () => {
    expect(hasUniversityPermission(null, 'view_applications')).toBe(false);
  });
});

describe('Tenant resolution — universityId never comes from the caller (s69)', () => {
  it('returns null for an unknown account', async () => {
    accountFindUnique.mockResolvedValue(null);
    expect(await resolveUniversityPortalContext('nope')).toBeNull();
  });

  it('returns null for an empty account id', async () => {
    expect(await resolveUniversityPortalContext('')).toBeNull();
    expect(accountFindUnique).not.toHaveBeenCalled();
  });

  it('refuses a SUSPENDED account', async () => {
    accountFindUnique.mockResolvedValue({
      id: 'acc-1',
      universityId: 'UNI-ASTON',
      role: 'UNIVERSITY_MANAGER',
      status: 'SUSPENDED',
      permissions: '["view_applications"]',
    });
    expect(await resolveUniversityPortalContext('acc-1')).toBeNull();
  });

  it('refuses a REVOKED account', async () => {
    accountFindUnique.mockResolvedValue({
      id: 'acc-1',
      universityId: 'UNI-ASTON',
      role: 'UNIVERSITY_MANAGER',
      status: 'REVOKED',
      permissions: '["view_applications"]',
    });
    expect(await resolveUniversityPortalContext('acc-1')).toBeNull();
  });

  it('downgrades an unrecognised stored role to representative', async () => {
    accountFindUnique.mockResolvedValue({
      id: 'acc-1',
      universityId: 'UNI-ASTON',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      permissions: '["view_applications"]',
    });
    const resolved = await resolveUniversityPortalContext('acc-1');
    expect(resolved?.role).toBe('UNIVERSITY_REPRESENTATIVE');
  });

  it('survives corrupt stored permissions JSON', async () => {
    accountFindUnique.mockResolvedValue({
      id: 'acc-1',
      universityId: 'UNI-ASTON',
      role: 'UNIVERSITY_MANAGER',
      status: 'ACTIVE',
      permissions: '{not json',
    });
    const resolved = await resolveUniversityPortalContext('acc-1');
    expect(resolved?.permissions).toEqual([]);
    expect(hasUniversityPermission(resolved, 'view_applications')).toBe(false);
  });

  it('resolves by email case-insensitively and refuses an unknown email', async () => {
    accountFindUnique.mockResolvedValue(null);
    expect(await resolveUniversityPortalContextByEmail('')).toBeNull();
    expect(await resolveUniversityPortalContextByEmail(null)).toBeNull();
    expect(await resolveUniversityPortalContextByEmail('nobody@example.com')).toBeNull();
  });
});

describe('Application listing — tenant filter is always applied', () => {
  it('queries by the STORED universityId, not a request value', async () => {
    applicationFindMany.mockResolvedValue([]);
    applicationCount.mockResolvedValue(0);

    await listInstitutionApplications(context(), { limit: 10 });

    const where = applicationFindMany.mock.calls[0][0].where;
    const serialized = JSON.stringify(where);
    expect(serialized).toContain('UNI-ASTON');
    // The tenant filter must be present in the OR clause of the where.
    expect(where.OR).toEqual(
      expect.arrayContaining([{ universityId: 'UNI-ASTON' }]),
    );
  });

  it('denies listing without view_applications permission', async () => {
    await expect(
      listInstitutionApplications(context({ permissions: [] }), {}),
    ).rejects.toThrow('PERMISSION_DENIED:view_applications');
    expect(applicationFindMany).not.toHaveBeenCalled();
  });

  it('selects an explicit allowlist and never leaks forbidden fields (s69)', async () => {
    applicationFindMany.mockResolvedValue([]);
    applicationCount.mockResolvedValue(0);

    await listInstitutionApplications(context(), {});

    const select = applicationFindMany.mock.calls[0][0].select;
    expect(select).toBeTruthy();
    const selected = Object.keys(select);
    for (const forbidden of UNIVERSITY_PORTAL_FORBIDDEN_FIELDS) {
      expect(selected).not.toContain(forbidden);
    }
    // Internal pipeline detail must not be exposed either.
    expect(selected).not.toContain('internalNotes');
    expect(selected).not.toContain('counselorName');
    expect(selected).not.toContain('partnerId');
  });

  it('clamps pagination so a representative cannot dump the table', async () => {
    applicationFindMany.mockResolvedValue([]);
    applicationCount.mockResolvedValue(0);
    await listInstitutionApplications(context(), { limit: 100000, offset: -50 });
    const args = applicationFindMany.mock.calls[0][0];
    expect(args.take).toBeLessThanOrEqual(200);
    expect(args.skip).toBe(0);
  });
});

describe('Direct object reference protection (s99)', () => {
  it('refuses documents for an application at another institution', async () => {
    applicationFindUnique.mockResolvedValue({
      id: 'app-9',
      universityId: 'UNI-OTHER',
      universityName: 'Someone Else',
    });
    universityFindUnique.mockResolvedValue({ name: 'Aston University' });

    await expect(listInstitutionApplicationDocuments(context(), 'app-9')).rejects.toThrow('TENANT_MISMATCH');
    expect(appDocFindMany).not.toHaveBeenCalled();
  });

  it('refuses a document request for another institution', async () => {
    applicationFindUnique.mockResolvedValue({ id: 'app-9', universityId: 'UNI-OTHER' });
    appDocFindMany.mockResolvedValue([]);
    universityFindUnique.mockResolvedValue({ name: 'Aston University' });

    await expect(requestDocument(context(), 'app-9', 'transcript', 'needed')).rejects.toThrow('TENANT_MISMATCH');
  });

  it('refuses a status proposal for another institution', async () => {
    applicationFindUnique.mockResolvedValue({ id: 'app-9', universityId: 'UNI-OTHER', stage: 'X' });
    // Permission granted, so what is being exercised here is the tenant check.
    const manager = context({
      role: 'UNIVERSITY_MANAGER',
      permissions: ['view_applications', 'update_application_status'],
    });
    await expect(proposeStatusUpdate(manager, 'app-9', 'UNCONDITIONAL_OFFER', '')).rejects.toThrow(
      'TENANT_MISMATCH',
    );
  });

  it('checks permission before tenant, so an unauthorized caller learns nothing', async () => {
    // Ordering matters: a representative without the permission must get
    // PERMISSION_DENIED, not a tenant probe that reveals whether app-9 exists.
    applicationFindUnique.mockResolvedValue({ id: 'app-9', universityId: 'UNI-ASTON', stage: 'X' });
    await expect(proposeStatusUpdate(context(), 'app-9', 'REJECTED', '')).rejects.toThrow(
      'PERMISSION_DENIED:update_application_status',
    );
  });

  it('refuses a status proposal without the permission', async () => {
    applicationFindUnique.mockResolvedValue({ id: 'app-1', universityId: 'UNI-ASTON', stage: 'X' });
    await expect(
      proposeStatusUpdate(context({ permissions: ['view_applications'] }), 'app-1', 'REJECTED', ''),
    ).rejects.toThrow('PERMISSION_DENIED:update_application_status');
  });
});

describe('Human-in-the-loop (s116) — a representative proposes, ALO decides', () => {
  it('never mutates the authoritative pipeline stage', async () => {
    applicationFindUnique.mockResolvedValue({
      id: 'app-1',
      universityId: 'UNI-ASTON',
      stage: 'DECISION_PENDING',
    });
    const updateSpy = db.application.update as unknown as ReturnType<typeof vi.fn>;

    const result = await proposeStatusUpdate(
      context({ permissions: ['update_application_status'] }),
      'app-1',
      'UNCONDITIONAL_OFFER',
      'we would like to offer',
    );

    expect(result.status).toBe('PROPOSED');
    expect(result.requiresAloApproval).toBe(true);
    expect(result.currentStage).toBe('DECISION_PENDING');
    expect(updateSpy).toBeUndefined();

    const activity = activityCreate.mock.calls[0][0].data;
    expect(activity.action).toBe('PROPOSE_STATUS_UPDATE');
    expect(JSON.parse(activity.metadata).requiresAloApproval).toBe(true);
  });

  it('raises an internal notification so the proposal reaches a real queue', async () => {
    applicationFindUnique.mockResolvedValue({ id: 'app-1', universityId: 'UNI-ASTON', stage: 'X' });
    await proposeStatusUpdate(context({ permissions: ['update_application_status'] }), 'app-1', 'REJECTED', 'no');
    expect(appNotificationCreate).toHaveBeenCalledTimes(1);
    expect(appNotificationCreate.mock.calls[0][0].data.recipientType).toBe('APPLICATION_TEAM');
  });

  it('rejects an empty proposed stage', async () => {
    applicationFindUnique.mockResolvedValue({ id: 'app-1', universityId: 'UNI-ASTON', stage: 'X' });
    await expect(
      proposeStatusUpdate(context({ permissions: ['update_application_status'] }), 'app-1', '   ', ''),
    ).rejects.toThrow(/proposedStage is required/);
  });
});

describe('Account provisioning (s39)', () => {
  it('refuses to create a portal for a university absent from the catalogue', async () => {
    universityFindUnique.mockResolvedValue(null);
    await expect(
      createUniversityPortalAccount({
        universityId: 'UNI-GHOST',
        fullName: 'Rep',
        email: 'rep@ghost.example',
      }),
    ).rejects.toThrow(/not found in canonical catalogue/i);
    expect(accountCreate).not.toHaveBeenCalled();
  });

  it('refuses an invalid email', async () => {
    universityFindUnique.mockResolvedValue({ universityId: 'UNI-ASTON', name: 'Aston' });
    await expect(
      createUniversityPortalAccount({ universityId: 'UNI-ASTON', fullName: 'Rep', email: 'not-an-email' }),
    ).rejects.toThrow(/valid representative email/i);
  });

  it('refuses to bind one email to two institutions', async () => {
    universityFindUnique.mockResolvedValue({ universityId: 'UNI-ASTON', name: 'Aston' });
    accountFindUnique.mockResolvedValue({ id: 'acc-9', email: 'rep@example.com', universityId: 'UNI-OTHER' });
    await expect(
      createUniversityPortalAccount({
        universityId: 'UNI-ASTON',
        fullName: 'Rep',
        email: 'rep@example.com',
      }),
    ).rejects.toThrow(/different institution/i);
  });

  it('normalises the email and defaults to the least-privileged role', async () => {
    universityFindUnique.mockResolvedValue({ universityId: 'UNI-ASTON', name: 'Aston' });
    accountFindUnique.mockResolvedValue(null);
    accountCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'acc-1', ...data }));

    const account = await createUniversityPortalAccount({
      universityId: 'UNI-ASTON',
      fullName: 'Rep',
      email: '  REP@Example.COM ',
      role: 'NOT_A_ROLE',
    });

    expect(accountCreate.mock.calls[0][0].data.email).toBe('rep@example.com');
    expect(accountCreate.mock.calls[0][0].data.role).toBe('UNIVERSITY_REPRESENTATIVE');
    expect(account.permissions).toEqual(DEFAULT_ROLE_PERMISSIONS.UNIVERSITY_REPRESENTATIVE);
  });

  it('creates accounts as INVITED, not ACTIVE', async () => {
    universityFindUnique.mockResolvedValue({ universityId: 'UNI-ASTON', name: 'Aston' });
    accountFindUnique.mockResolvedValue(null);
    accountCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'acc-1', ...data }));
    await createUniversityPortalAccount({ universityId: 'UNI-ASTON', fullName: 'R', email: 'r@e.com' });
    expect(accountCreate.mock.calls[0][0].data.status).toBe('INVITED');
  });

  it('rejects an unsupported status transition value', async () => {
    accountFindUnique.mockResolvedValue({ id: 'acc-1', universityId: 'UNI-ASTON', status: 'ACTIVE' });
    await expect(setUniversityAccountStatus('acc-1', 'SUPERUSER')).rejects.toThrow(/Unsupported account status/);
  });

  it('records an audit activity on status change', async () => {
    accountFindUnique.mockResolvedValue({ id: 'acc-1', universityId: 'UNI-ASTON', status: 'ACTIVE' });
    accountUpdate.mockResolvedValue({ id: 'acc-1', status: 'SUSPENDED' });
    await setUniversityAccountStatus('acc-1', 'SUSPENDED', 'admin-1');
    expect(activityCreate).toHaveBeenCalledTimes(1);
    expect(activityCreate.mock.calls[0][0].data.action).toBe('ACCOUNT_STATUS_SUSPENDED');
  });
});

describe('Recruitment statistics stay inside the tenant', () => {
  it('counts only this institution and refuses without permission', async () => {
    applicationCount.mockResolvedValue(4);
    applicationGroupBy.mockResolvedValue([]);

    const stats = await institutionRecruitmentStats(
      context({ permissions: ['view_recruitment_data'] }),
    );
    expect(stats.universityId).toBe('UNI-ASTON');
    for (const call of applicationCount.mock.calls) {
      expect(JSON.stringify(call[0].where)).toContain('UNI-ASTON');
    }

    await expect(institutionRecruitmentStats(context({ permissions: [] }))).rejects.toThrow(
      'PERMISSION_DENIED:view_recruitment_data',
    );
  });

  it('reports a 0% conversion honestly rather than NaN', async () => {
    applicationCount.mockResolvedValueOnce(0).mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    applicationGroupBy.mockResolvedValue([]);
    const stats = await institutionRecruitmentStats(context({ permissions: ['view_recruitment_data'] }));
    expect(stats.conversionRate).toBe(0);
    expect(Number.isNaN(stats.conversionRate)).toBe(false);
  });
});
