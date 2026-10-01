// AI model registry contracts (src/lib/ai-models/registry.ts).
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    aiModel: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    aiModelVersion: { create: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    aiModelEvaluation: { create: vi.fn(), count: vi.fn() },
    aiModelDeployment: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn(), count: vi.fn() },
    aiModelDepartmentAssignment: { upsert: vi.fn(), count: vi.fn() },
    department: { findUnique: vi.fn() },
    enterpriseDepartment: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));
import { db } from '@/lib/db';
import {
  registerModel,
  addModelVersion,
  recordEvaluation,
  promoteDeployment,
  rollbackDeployment,
  assignModelToDepartment,
  registryOverview,
} from '@/lib/ai-models/registry';

const MODEL = { id: 'm1', modelCode: 'alo-admissions-v1', status: 'REGISTERED', currentVersionId: null };
const VERSION = { id: 'v1', modelId: 'm1', version: 1, status: 'DRAFT', evaluations: [], deployments: [] };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('registration', () => {
  it('registers a model with a kebab-case code', async () => {
    vi.mocked(db.aiModel.create).mockResolvedValue(MODEL as never);
    await registerModel({ name: 'Admissions Counselor', taskType: 'counseling' }, 'admin');
    expect(db.aiModel.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ modelCode: 'alo-admissions-counselor', taskType: 'counseling', status: 'REGISTERED' }),
    });
  });
  it('rejects invalid codes and task types', async () => {
    await expect(registerModel({ name: 'X', modelCode: 'Bad Code!' }, 'a')).rejects.toThrow(/kebab-case/);
    await expect(registerModel({ name: 'X', taskType: 'rocket-science' }, 'a')).rejects.toThrow(/task type/);
  });
});

describe('versions', () => {
  it('increments the version atomically', async () => {
    const tx = {
      aiModel: { findUnique: vi.fn().mockResolvedValue(MODEL) },
      aiModelVersion: {
        findFirst: vi.fn().mockResolvedValue({ version: 3 }),
        create: vi.fn().mockResolvedValue({ id: 'v4', version: 4 }),
      },
    };
    vi.mocked(db.$transaction).mockImplementation(async (fn: any) => fn(tx));
    const version = await addModelVersion({ modelId: 'm1', adapterType: 'RAG' }, 'admin');
    expect(version).toMatchObject({ version: 4 });
    expect(tx.aiModelVersion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ version: 4, adapterType: 'RAG', status: 'DRAFT' }),
    });
  });
  it('rejects retired models and invalid adapters', async () => {
    const tx = {
      aiModel: { findUnique: vi.fn().mockResolvedValue({ ...MODEL, status: 'RETIRED' }) },
      aiModelVersion: { findFirst: vi.fn(), create: vi.fn() },
    };
    vi.mocked(db.$transaction).mockImplementation(async (fn: any) => fn(tx));
    await expect(addModelVersion({ modelId: 'm1' }, 'a')).rejects.toThrow(/Retired/);
    await expect(addModelVersion({ modelId: 'm1', adapterType: 'MAGIC' }, 'a')).rejects.toThrow(/adapter/);
  });
});

describe('evaluation gate', () => {
  it('records evaluations and flips DRAFT to EVALUATED on pass', async () => {
    vi.mocked(db.aiModelVersion.findUnique).mockResolvedValue(VERSION as never);
    vi.mocked(db.aiModelEvaluation.create).mockResolvedValue({ id: 'e1', passed: true } as never);
    await recordEvaluation({ versionId: 'v1', benchmark: 'admissions-qa-v3', score: 91.5, datasetVersion: 'ds-2026-09' });
    expect(db.aiModelEvaluation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ benchmark: 'admissions-qa-v3', score: 91.5, passed: true }),
    });
    expect(db.aiModelVersion.update).toHaveBeenCalledWith({ where: { id: 'v1' }, data: { status: 'EVALUATED' } });
  });
  it('rejects out-of-range scores and missing benchmarks', async () => {
    await expect(recordEvaluation({ versionId: 'v1', benchmark: 'b', score: 101 })).rejects.toThrow(/0\.\.100/);
    await expect(recordEvaluation({ versionId: 'v1', benchmark: '', score: 90 })).rejects.toThrow(/benchmark/);
  });
});

describe('deployment promotion and rollback', () => {
  function txWith(version: any, deployment = null) {
    return {
      aiModelVersion: {
        findUnique: vi.fn().mockResolvedValue({ ...VERSION, model: MODEL, ...version }),
        update: vi.fn(),
      },
      aiModelDeployment: {
        findFirst: vi.fn().mockResolvedValue(deployment),
        update: vi.fn(),
        create: vi.fn().mockImplementation(({ data }: any) => ({ id: 'd_new', ...data })),
      },
      aiModel: { update: vi.fn() },
    };
  }

  it('PRODUCTION promotion is blocked without a passing evaluation', async () => {
    const tx = txWith({ evaluations: [] });
    vi.mocked(db.$transaction).mockImplementation(async (fn: any) => fn(tx));
    await expect(promoteDeployment({ versionId: 'v1', environment: 'PRODUCTION', activatedById: 'ops' }))
      .rejects.toThrow(/PASSING evaluation/);
  });

  it('STAGING promotion works without evaluation', async () => {
    const tx = txWith({ evaluations: [] });
    vi.mocked(db.$transaction).mockImplementation(async (fn: any) => fn(tx));
    await expect(promoteDeployment({ versionId: 'v1', environment: 'STAGING', activatedById: 'ops' })).resolves.toBeTruthy();
  });

  it('promotion supersedes the current ACTIVE deployment atomically', async () => {
    const tx = txWith(
      { status: 'EVALUATED', evaluations: [{ passed: true }], model: MODEL },
      { id: 'd_old', status: 'ACTIVE' },
    );
    vi.mocked(db.$transaction).mockImplementation(async (fn: any) => fn(tx));
    const deployment = await promoteDeployment({ versionId: 'v1', environment: 'PRODUCTION', activatedById: 'ops' });
    expect(deployment).toMatchObject({ environment: 'PRODUCTION' });
    expect(tx.aiModelDeployment.update).toHaveBeenCalledWith({
      where: { id: 'd_old' },
      data: expect.objectContaining({ status: 'ROLLED_BACK', rollbackReason: expect.stringContaining('Superseded') }),
    });
    expect(tx.aiModel.update).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { status: 'PRODUCTION', currentVersionId: 'v1' },
    });
  });

  it('rollback is conditional, requires a reason, and clears the model pointer', async () => {
    const tx = {
      aiModelDeployment: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: 'd1', versionId: 'v1',
          version: { modelId: 'm1', model: { id: 'm1', currentVersionId: 'v1' } },
        }),
      },
      aiModel: { update: vi.fn() },
    };
    vi.mocked(db.$transaction).mockImplementation(async (fn: any) => fn(tx));
    await expect(rollbackDeployment('d1', '', 'ops')).rejects.toThrow(/reason/);
    await rollbackDeployment('d1', 'accuracy regression in production', 'ops');
    expect(tx.aiModel.update).toHaveBeenCalledWith({
      where: { id: 'm1' }, data: { currentVersionId: null, status: 'STAGING' },
    });
    tx.aiModelDeployment.updateMany.mockResolvedValue({ count: 0 });
    await expect(rollbackDeployment('d1', 'again', 'ops')).rejects.toThrow(/already rolled back/);
  });
});

describe('department assignment and overview', () => {
  it('assigns only to real departments (either registry)', async () => {
    vi.mocked(db.aiModel.findUnique).mockResolvedValue(MODEL as never);
    vi.mocked(db.department.findUnique).mockResolvedValue(null as never);
    vi.mocked(db.enterpriseDepartment.findUnique).mockResolvedValue({ id: 'ed1' } as never);
    vi.mocked(db.aiModelDepartmentAssignment.upsert).mockResolvedValue({ id: 'x' } as never);
    await assignModelToDepartment('m1', 'ed1');
    expect(db.aiModelDepartmentAssignment.upsert).toHaveBeenCalledWith({
      where: { modelId_departmentId: { modelId: 'm1', departmentId: 'ed1' } },
      update: {},
      create: { modelId: 'm1', departmentId: 'ed1' },
    });
    vi.mocked(db.enterpriseDepartment.findUnique).mockResolvedValue(null as never);
    await expect(assignModelToDepartment('m1', 'nope')).rejects.toThrow(/not found/);
  });

  it('overview reports deployment evidence, not claims', async () => {
    vi.mocked(db.aiModel.findMany).mockResolvedValue([
      {
        ...MODEL, status: 'PRODUCTION', currentVersionId: 'v1',
        versions: [
          { version: 2, evaluations: [], deployments: [] },
          { version: 1, evaluations: [{ passed: true }], deployments: [{ environment: 'PRODUCTION', status: 'ACTIVE' }] },
        ],
      },
    ] as never);
    vi.mocked(db.aiModelDeployment.count).mockResolvedValue(1 as never);
    vi.mocked(db.aiModelEvaluation.count).mockResolvedValue(1 as never);
    vi.mocked(db.aiModelDepartmentAssignment.count).mockResolvedValue(3 as never);
    const overview = await registryOverview();
    expect(overview.stats).toEqual({
      totalModels: 1, productionModels: 1, activeProductionDeployments: 1,
      totalVersions: 2, passingEvaluations: 1, departmentAssignments: 3,
    });
    expect(overview.models[0]).toMatchObject({ activeProductionDeployment: true, evaluatedVersions: 1 });
  });
});
