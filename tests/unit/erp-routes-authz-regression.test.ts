/**
 * ALO Education — Accounting / Procurement / Assets / AI-model registry
 * authorization regression tests.
 *
 * These import the REAL route handlers (not a re-implementation) and assert:
 *   1. unauthenticated callers receive 401 and trigger ZERO database calls
 *   2. unauthorized (student) callers receive 403 and trigger ZERO database calls
 * Only `@/lib/db` and `next-auth` are mocked; the authorization logic under
 * test (`@/lib/auth-middleware`) is the real implementation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { dbCalls, dbMock } = vi.hoisted(() => {
  const calls: string[] = [];
  const record = (name: string) => (..._args: unknown[]) => {
    calls.push(name);
    return Promise.resolve(null);
  };
  const passthrough = (name: string) => (...args: unknown[]) => {
    calls.push(name);
    // $transaction(fn) must execute fn for service-level assertions; the
    // individual tx methods below also record.
    if (typeof args[0] === 'function' && name === '$transaction') {
      return (args[0] as (tx: unknown) => unknown)({});
    }
    return Promise.resolve(null);
  };
  return {
    dbCalls: calls,
    dbMock: {
      chartOfAccount: { findMany: record('chartOfAccount.findMany'), createMany: record('chartOfAccount.createMany'), findUnique: record('chartOfAccount.findUnique') },
      journalEntry: { create: record('journalEntry.create'), findMany: record('journalEntry.findMany'), findUnique: record('journalEntry.findUnique'), count: record('journalEntry.count'), update: record('journalEntry.update') },
      fiscalPeriod: { findFirst: record('fiscalPeriod.findFirst'), findUnique: record('fiscalPeriod.findUnique'), findMany: record('fiscalPeriod.findMany'), create: record('fiscalPeriod.create'), update: record('fiscalPeriod.update') },
      vendor: { findMany: record('vendor.findMany'), findUnique: record('vendor.findUnique'), count: record('vendor.count'), create: record('vendor.create'), update: record('vendor.update') },
      purchaseRequest: { findMany: record('purchaseRequest.findMany'), findUnique: record('purchaseRequest.findUnique'), count: record('purchaseRequest.count'), create: record('purchaseRequest.create'), updateMany: record('purchaseRequest.updateMany'), findUniqueOrThrow: record('purchaseRequest.findUniqueOrThrow') },
      purchaseOrder: { findMany: record('purchaseOrder.findMany'), findUnique: record('purchaseOrder.findUnique'), count: record('purchaseOrder.count'), create: record('purchaseOrder.create'), updateMany: record('purchaseOrder.updateMany'), findUniqueOrThrow: record('purchaseOrder.findUniqueOrThrow'), update: record('purchaseOrder.update') },
      purchaseOrderLine: { update: record('purchaseOrderLine.update') },
      vendorInvoice: { findMany: record('vendorInvoice.findMany'), findUnique: record('vendorInvoice.findUnique'), count: record('vendorInvoice.count'), create: record('vendorInvoice.create'), update: record('vendorInvoice.update') },
      fixedAsset: { findMany: record('fixedAsset.findMany'), findUnique: record('fixedAsset.findUnique'), count: record('fixedAsset.count'), create: record('fixedAsset.create'), update: record('fixedAsset.update'), updateMany: record('fixedAsset.updateMany'), findUniqueOrThrow: record('fixedAsset.findUniqueOrThrow') },
      assetAssignment: { create: record('assetAssignment.create'), findFirst: record('assetAssignment.findFirst'), update: record('assetAssignment.update') },
      assetMaintenance: { create: record('assetMaintenance.create') },
      depreciationEntry: { create: record('depreciationEntry.create') },
      aiModel: { findMany: record('aiModel.findMany'), findUnique: record('aiModel.findUnique'), create: record('aiModel.create'), update: record('aiModel.update') },
      aiModelVersion: { findFirst: record('aiModelVersion.findFirst'), findUnique: record('aiModelVersion.findUnique'), create: record('aiModelVersion.create'), update: record('aiModelVersion.update') },
      aiModelEvaluation: { create: record('aiModelEvaluation.create'), count: record('aiModelEvaluation.count') },
      aiModelDeployment: { findFirst: record('aiModelDeployment.findFirst'), create: record('aiModelDeployment.create'), update: record('aiModelDeployment.update'), updateMany: record('aiModelDeployment.updateMany'), count: record('aiModelDeployment.count') },
      aiModelDepartmentAssignment: { upsert: record('aiModelDepartmentAssignment.upsert'), count: record('aiModelDepartmentAssignment.count'), findMany: record('aiModelDepartmentAssignment.findMany') },
      department: { findUnique: record('department.findUnique') },
      enterpriseDepartment: { findUnique: record('enterpriseDepartment.findUnique') },
      user: { findUnique: (...args: unknown[]) => { calls.push('user.findUnique'); const id = (args[0] as { where: { id: string } })?.where?.id; return Promise.resolve(id === 'student-1' ? { id: 'student-1', email: 'student@example.com', name: 'Student', role: 'STUDENT', status: 'ACTIVE', permissions: '[]' } : null); } },
      $queryRaw: record('$queryRaw'),
      $transaction: passthrough('$transaction'),
    },
  };
});

vi.mock('@/lib/db', () => ({ db: dbMock }));

let session: { user?: unknown } | null = null;
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(() => Promise.resolve(session)),
  NextAuth: vi.fn(),
}));

import { GET as chartGET, POST as chartPOST } from '@/app/api/accounting/chart-of-accounts/route';
import { GET as journalsGET, POST as journalsPOST } from '@/app/api/accounting/journal-entries/route';
import { POST as reversePOST } from '@/app/api/accounting/journal-entries/[id]/reverse/route';
import { GET as trialGET } from '@/app/api/accounting/trial-balance/route';
import { GET as periodsGET, POST as periodsPOST } from '@/app/api/accounting/fiscal-periods/route';
import { POST as closePOST } from '@/app/api/accounting/fiscal-periods/[name]/close/route';
import { GET as vendorsGET, POST as vendorsPOST } from '@/app/api/procurement/vendors/route';
import { GET as prGET, POST as prPOST } from '@/app/api/procurement/purchase-requests/route';
import { PATCH as prPATCH } from '@/app/api/procurement/purchase-requests/[id]/route';
import { GET as poGET, POST as poPOST } from '@/app/api/procurement/purchase-orders/route';
import { PATCH as poPATCH } from '@/app/api/procurement/purchase-orders/[id]/route';
import { GET as viGET, POST as viPOST, PATCH as viPATCH } from '@/app/api/procurement/vendor-invoices/route';
import { GET as assetsGET, POST as assetsPOST } from '@/app/api/assets/route';
import { GET as assetGET, PATCH as assetPATCH } from '@/app/api/assets/[id]/route';
import { POST as depreciationPOST } from '@/app/api/assets/depreciation/route';
import { GET as modelsGET, POST as modelsPOST } from '@/app/api/ai-models/route';
import { GET as versionsGET, POST as versionsPOST, PATCH as versionsPATCH } from '@/app/api/ai-models/[id]/versions/route';
import { GET as deptsGET, POST as deptsPOST } from '@/app/api/ai-models/[id]/departments/route';

const req = (method: string, body?: unknown) => new Request('http://localhost/api/x', {
  method,
  headers: body !== undefined ? { 'content-type': 'application/json' } : {},
  body: body !== undefined ? JSON.stringify(body) : undefined,
});

/** withAuth returns a 401/403 Response instead of throwing. */
async function status(promise: Promise<Response>): Promise<number> {
  const res = await promise;
  expect(res).toBeInstanceOf(Response);
  return res.status;
}

beforeEach(() => {
  dbCalls.length = 0;
  session = null;
});

const noSessionContext = { params: Promise.resolve({ id: 'x1', name: '2026-10' }) };

describe('unauthenticated callers are rejected before any data access', () => {
  it('accounting routes', async () => {
    await expect(status(chartGET(req('GET')))).resolves.toBe(401);
    await expect(status(chartPOST(req('POST', {})))).resolves.toBe(401);
    await expect(status(journalsGET(req('GET')))).resolves.toBe(401);
    await expect(status(journalsPOST(req('POST', { memo: 'x' })))).resolves.toBe(401);
    await expect(status(reversePOST(req('POST', {}), undefined, noSessionContext))).resolves.toBe(401);
    await expect(status(trialGET(req('GET')))).resolves.toBe(401);
    await expect(status(periodsGET(req('GET')))).resolves.toBe(401);
    await expect(status(periodsPOST(req('POST', {})))).resolves.toBe(401);
    await expect(status(closePOST(req('POST'), undefined, noSessionContext))).resolves.toBe(401);
    expect(dbCalls).toEqual([]);
  });

  it('procurement routes', async () => {
    await expect(status(vendorsGET(req('GET')))).resolves.toBe(401);
    await expect(status(vendorsPOST(req('POST', { name: 'V' })))).resolves.toBe(401);
    await expect(status(prGET(req('GET')))).resolves.toBe(401);
    await expect(status(prPOST(req('POST', { title: 'T', lines: [] })))).resolves.toBe(401);
    await expect(status(prPATCH(req('PATCH', { action: 'submit' }), undefined, noSessionContext))).resolves.toBe(401);
    await expect(status(poGET(req('GET')))).resolves.toBe(401);
    await expect(status(poPOST(req('POST', { requestId: 'r', vendorId: 'v' })))).resolves.toBe(401);
    await expect(status(poPATCH(req('PATCH', { action: 'approve' }), undefined, noSessionContext))).resolves.toBe(401);
    await expect(status(viGET(req('GET')))).resolves.toBe(401);
    await expect(status(viPOST(req('POST', {})))).resolves.toBe(401);
    await expect(status(viPATCH(req('PATCH', { action: 'match' })))).resolves.toBe(401);
    expect(dbCalls).toEqual([]);
  });

  it('asset routes', async () => {
    await expect(status(assetsGET(req('GET')))).resolves.toBe(401);
    await expect(status(assetsPOST(req('POST', {})))).resolves.toBe(401);
    await expect(status(assetGET(req('GET'), undefined, noSessionContext))).resolves.toBe(401);
    await expect(status(assetPATCH(req('PATCH', { action: 'assign' }), undefined, noSessionContext))).resolves.toBe(401);
    await expect(status(depreciationPOST(req('POST', { period: '2026-10' })))).resolves.toBe(401);
    expect(dbCalls).toEqual([]);
  });

  it('ai-model registry routes', async () => {
    await expect(status(modelsGET(req('GET')))).resolves.toBe(401);
    await expect(status(modelsPOST(req('POST', { name: 'M' })))).resolves.toBe(401);
    await expect(status(versionsGET(req('GET'), undefined, noSessionContext))).resolves.toBe(401);
    await expect(status(versionsPOST(req('POST', {}), undefined, noSessionContext))).resolves.toBe(401);
    await expect(status(versionsPATCH(req('PATCH', { action: 'promote' }), undefined, noSessionContext))).resolves.toBe(401);
    await expect(status(deptsGET(req('GET'), undefined, noSessionContext))).resolves.toBe(401);
    await expect(status(deptsPOST(req('POST', { departmentId: 'd' }), undefined, noSessionContext))).resolves.toBe(401);
    expect(dbCalls).toEqual([]);
  });
});

describe('student sessions cannot reach staff-only surfaces', () => {
  beforeEach(() => {
    session = { user: { id: 'student-1', email: 'student@example.com', name: 'Student' } };
  });

  it('accounting, procurement, assets and model registry reject STUDENT', async () => {
    await expect(status(chartGET(req('GET')))).resolves.toBe(403);
    await expect(status(trialGET(req('GET')))).resolves.toBe(403);
    await expect(status(vendorsGET(req('GET')))).resolves.toBe(403);
    await expect(status(assetsPOST(req('POST', {})))).resolves.toBe(403);
    await expect(status(modelsPOST(req('POST', { name: 'M' })))).resolves.toBe(403);
    await expect(status(journalsPOST(req('POST', { memo: 'x', date: '2026-10-01', lines: [] })))).resolves.toBe(403);
    await expect(status(depreciationPOST(req('POST', { period: '2026-10' })))).resolves.toBe(403);
    // Only the session's own user lookup may touch the database; no business
    // model may be queried or mutated by a rejected STUDENT request.
    expect(dbCalls.filter((c) => c !== 'user.findUnique')).toEqual([]);
  });
});
