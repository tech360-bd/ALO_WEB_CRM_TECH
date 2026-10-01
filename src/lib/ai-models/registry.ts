// ============================================================================
// ALO Education — AI model registry service.
//
// Implements the department-specialized AI objective with PERSISTED evidence:
//   * models (e.g. alo-admissions-v1) with versioned adapters
//     (PROMPT / RAG / FINE_TUNE / LORA / ROUTER / ENSEMBLE)
//   * evaluations against named benchmarks with dataset versions
//   * promotion gate: a version can only be deployed to PRODUCTION when it has
//     a PASSING evaluation — enforced transactionally, never by convention
//   * one ACTIVE production deployment per model; promotion rolls the previous
//     one back atomically; explicit rollback records the reason
//   * department assignment (which department uses which model)
//   * everything is queryable history, not claims.
// ============================================================================

import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export const AI_MODEL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'AI_OFFICER'];

export interface RegisterModelInput {
  modelCode?: string;
  name: string;
  taskType?: string;
  description?: string;
}

export async function registerModel(input: RegisterModelInput, createdById: string) {
  if (!input.name?.trim()) throw new Error('Model name is required');
  if (!createdById?.trim()) throw new Error('Registering a model requires an actor');
  const modelCode = input.modelCode?.trim() || `alo-${input.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`;
  if (!/^[a-z0-9-]+$/.test(modelCode)) throw new Error('Model code must be lowercase kebab-case');
  if (input.taskType && !['counseling', 'matching', 'verification', 'content', 'analysis', 'general'].includes(input.taskType)) {
    throw new Error('Invalid task type');
  }
  return db.aiModel.create({
    data: {
      modelCode, name: input.name.trim(), taskType: input.taskType ?? 'general',
      description: input.description ?? '', status: 'REGISTERED',
    },
  });
}

export async function addModelVersion(input: {
  modelId: string; adapterType?: string; baseModel?: string; datasetVersion?: string;
  trainingNotes?: string; artifactRef?: string;
}, createdById: string) {
  if (!input.modelId?.trim()) throw new Error('Model id is required');
  if (input.adapterType && !['PROMPT', 'RAG', 'FINE_TUNE', 'LORA', 'ROUTER', 'ENSEMBLE'].includes(input.adapterType)) {
    throw new Error('Invalid adapter type');
  }
  return db.$transaction(async (tx) => {
    const model = await tx.aiModel.findUnique({ where: { id: input.modelId } });
    if (!model) throw new Error('Model not found');
    if (model.status === 'RETIRED') throw new Error('Retired models cannot receive new versions');
    const latest = await tx.aiModelVersion.findFirst({
      where: { modelId: model.id },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const version = (latest?.version ?? 0) + 1;
    return tx.aiModelVersion.create({
      data: {
        modelId: model.id, version, adapterType: input.adapterType ?? 'PROMPT',
        baseModel: input.baseModel ?? '', datasetVersion: input.datasetVersion ?? '',
        trainingNotes: input.trainingNotes ?? '', artifactRef: input.artifactRef ?? '',
        status: 'DRAFT', createdById,
      },
    });
  });
}

export async function recordEvaluation(input: {
  versionId: string; benchmark: string; score: number; datasetVersion?: string; passed?: boolean; details?: unknown;
}) {
  if (!input.benchmark?.trim()) throw new Error('Evaluation requires a benchmark name');
  if (!Number.isFinite(input.score) || input.score < 0 || input.score > 100) {
    throw new Error('Evaluation score must be 0..100');
  }
  const version = await db.aiModelVersion.findUnique({ where: { id: input.versionId } });
  if (!version) throw new Error('Model version not found');
  // Default pass threshold: 80. Explicit `passed` overrides for benchmarks with
  // their own rubric — the decision is persisted either way.
  const passed = input.passed ?? input.score >= 80;
  const evaluation = await db.aiModelEvaluation.create({
    data: {
      versionId: version.id, benchmark: input.benchmark.trim(), score: input.score,
      datasetVersion: input.datasetVersion ?? '', passed,
      details: JSON.stringify(input.details ?? {}),
    },
  });
  if (passed && version.status === 'DRAFT') {
    await db.aiModelVersion.update({ where: { id: version.id }, data: { status: 'EVALUATED' } });
  }
  return evaluation;
}

/** Promotion gate: PRODUCTION requires a PASSING evaluation on the version. */
async function assertPromotable(tx: Prisma.TransactionClient, versionId: string, environment: string) {
  const version = await tx.aiModelVersion.findUnique({
    where: { id: versionId },
    include: { evaluations: true, model: true },
  });
  if (!version) throw new Error('Model version not found');
  if (version.model.status === 'RETIRED') throw new Error('Cannot deploy a version of a retired model');
  if (environment === 'PRODUCTION') {
    const passing = version.evaluations.some((e) => e.passed);
    if (!passing) {
      throw new Error('Deployment gate: a version needs at least one PASSING evaluation before PRODUCTION promotion');
    }
  }
  return version;
}

export async function promoteDeployment(input: {
  versionId: string; environment?: 'STAGING' | 'PRODUCTION'; activatedById: string; notes?: string;
}) {
  if (!input.activatedById?.trim()) throw new Error('Deployment requires an actor');
  const environment = input.environment ?? 'STAGING';
  return db.$transaction(async (tx) => {
    const version = await assertPromotable(tx, input.versionId, environment);
    // Exactly one ACTIVE deployment per (model, environment): deactivate the
    // current one atomically before activating the new one.
    const current = await tx.aiModelDeployment.findFirst({
      where: { version: { modelId: version.modelId }, environment, status: 'ACTIVE' },
    });
    if (current) {
      await tx.aiModelDeployment.update({
        where: { id: current.id },
        data: { status: 'ROLLED_BACK', rolledBackAt: new Date(), rollbackReason: `Superseded by version ${version.version}` },
      });
    }
    const deployment = await tx.aiModelDeployment.create({
      data: {
        versionId: version.id, modelId: version.modelId, environment,
        activatedById: input.activatedById, notes: input.notes ?? '',
      },
    });
    await tx.aiModelVersion.update({ where: { id: version.id }, data: { status: 'PRODUCTION' } });
    await tx.aiModel.update({
      where: { id: version.modelId },
      data: {
        status: environment === 'PRODUCTION' ? 'PRODUCTION' : 'STAGING',
        currentVersionId: version.id,
      },
    });
    return deployment;
  });
}

export async function rollbackDeployment(deploymentId: string, rollbackReason: string, rolledBackById: string) {
  if (!rollbackReason?.trim()) throw new Error('Rollback requires a reason');
  if (!rolledBackById?.trim()) throw new Error('Rollback requires an actor');
  return db.$transaction(async (tx) => {
    const changed = await tx.aiModelDeployment.updateMany({
      where: { id: deploymentId, status: 'ACTIVE' },
      data: { status: 'ROLLED_BACK', rolledBackAt: new Date(), rollbackReason: rollbackReason.trim() },
    });
    if (changed.count !== 1) throw new Error('Deployment is missing or already rolled back');
    const deployment = await tx.aiModelDeployment.findUniqueOrThrow({
      where: { id: deploymentId },
      include: { version: { include: { model: true } } },
    });
    // If this was the model's current production deployment, clear the pointer.
    if (deployment.version.model.currentVersionId === deployment.versionId) {
      await tx.aiModel.update({
        where: { id: deployment.version.modelId },
        data: { currentVersionId: null, status: 'STAGING' },
      });
    }
    return deployment;
  });
}

export async function assignModelToDepartment(modelId: string, departmentId: string) {
  if (!departmentId?.trim()) throw new Error('Department assignment requires a department');
  const model = await db.aiModel.findUnique({ where: { id: modelId } });
  if (!model) throw new Error('Model not found');
  // Departments live in two registries (Department, EnterpriseDepartment);
  // an assignment must resolve to a real one in either.
  const department = (await db.department.findUnique({ where: { id: departmentId } }))
    ?? (await db.enterpriseDepartment.findUnique({ where: { id: departmentId } }));
  if (!department) throw new Error('Department not found in Department or EnterpriseDepartment registries');
  return db.aiModelDepartmentAssignment.upsert({
    where: { modelId_departmentId: { modelId, departmentId } },
    update: {},
    create: { modelId, departmentId },
  });
}

/** Registry overview with deployment evidence — used by the command center. */
export async function registryOverview() {
  const [models, deployments, evaluations, assignments] = await Promise.all([
    db.aiModel.findMany({
      include: { versions: { orderBy: { version: 'desc' }, include: { evaluations: true, deployments: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    db.aiModelDeployment.count({ where: { environment: 'PRODUCTION', status: 'ACTIVE' } }),
    db.aiModelEvaluation.count({ where: { passed: true } }),
    db.aiModelDepartmentAssignment.count(),
  ]);
  return {
    models: models.map((m) => ({
      id: m.id,
      modelCode: m.modelCode,
      name: m.name,
      taskType: m.taskType,
      status: m.status,
      currentVersionId: m.currentVersionId,
      versionCount: m.versions.length,
      latestVersion: m.versions[0]?.version ?? null,
      evaluatedVersions: m.versions.filter((v) => v.evaluations.some((e) => e.passed)).length,
      activeProductionDeployment: m.versions.some((v) => v.deployments.some((d) => d.environment === 'PRODUCTION' && d.status === 'ACTIVE')),
    })),
    stats: {
      totalModels: models.length,
      productionModels: models.filter((m) => m.status === 'PRODUCTION').length,
      activeProductionDeployments: deployments,
      totalVersions: models.reduce((s, m) => s + m.versions.length, 0),
      passingEvaluations: evaluations,
      departmentAssignments: assignments,
    },
  };
}
