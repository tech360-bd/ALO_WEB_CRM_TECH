import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { addModelVersion, recordEvaluation, promoteDeployment, rollbackDeployment } from '@/lib/ai-models/registry';

// ============================================================
// GET   /api/ai-models/[id]/versions — version history with
//       evaluations and deployments
// POST  /api/ai-models/[id]/versions — add a version
// PATCH /api/ai-models/[id]/versions — transitions:
//        { action: 'evaluate', versionId, benchmark, score, ... }
//        { action: 'promote',  versionId, environment }
//        { action: 'rollback', deploymentId, reason }
// ============================================================

export const GET = withAuth(async (
  _request: Request,
  _auth,
  context?: { params: Promise<{ id: string }> },
) => {
  const { id } = await context!.params;
  const model = await db.aiModel.findUnique({
    where: { id },
    include: {
      versions: {
        orderBy: { version: 'desc' },
        include: { evaluations: true, deployments: true },
      },
      departments: true,
    },
  });
  if (!model) return NextResponse.json({ error: 'Model not found' }, { status: 404 });
  return NextResponse.json(model);
}, { requireUserTypes: ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'CEO', 'AI_OFFICER', 'EMPLOYEE'] });

export const POST = withAuth(async (
  request: Request,
  auth,
  context?: { params: Promise<{ id: string }> },
) => {
  const { id } = await context!.params;
  const body = await request.json().catch(() => null);
  try {
    const version = await addModelVersion({
      modelId: id,
      adapterType: body?.adapterType,
      baseModel: body?.baseModel,
      datasetVersion: body?.datasetVersion,
      trainingNotes: body?.trainingNotes,
      artifactRef: body?.artifactRef,
    }, auth.actorUserId);
    return NextResponse.json(version, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add version';
    const notFound = /not found/.test(message);
    return NextResponse.json({ error: message }, { status: notFound ? 404 : 400 });
  }
}, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN', 'AI_OFFICER'] });

export const PATCH = withAuth(async (
  request: Request,
  auth,
  context?: { params: Promise<{ id: string }> },
) => {
  const { id } = await context!.params;
  const body = await request.json().catch(() => null);
  const action = body?.action;
  if (!['evaluate', 'promote', 'rollback'].includes(action)) {
    return NextResponse.json({ error: 'action must be evaluate, promote or rollback' }, { status: 400 });
  }
  try {
    if (action === 'evaluate') {
      if (!body.versionId || !body.benchmark || body.score === undefined) {
        return NextResponse.json({ error: 'versionId, benchmark and score are required' }, { status: 400 });
      }
      return NextResponse.json(await recordEvaluation({
        versionId: body.versionId,
        benchmark: body.benchmark,
        score: Number(body.score),
        datasetVersion: body.datasetVersion,
        passed: body.passed,
        details: body.details,
      }), { status: 201 });
    }
    if (action === 'promote') {
      if (!body.versionId) {
        return NextResponse.json({ error: 'versionId is required' }, { status: 400 });
      }
      const deployment = await promoteDeployment({
        versionId: body.versionId,
        environment: body.environment === 'PRODUCTION' ? 'PRODUCTION' : 'STAGING',
        activatedById: auth.actorUserId,
        notes: body.notes,
      });
      return NextResponse.json(deployment, { status: 201 });
    }
    if (!body.deploymentId || !body.reason) {
      return NextResponse.json({ error: 'deploymentId and reason are required' }, { status: 400 });
    }
    return NextResponse.json(await rollbackDeployment(body.deploymentId, body.reason, auth.actorUserId));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Transition failed';
    const gate = /PASSING evaluation/.test(message);
    const conflict = /already rolled back|already rolled/.test(message);
    const notFound = /not found/.test(message);
    return NextResponse.json({ error: message }, { status: gate ? 403 : conflict ? 409 : notFound ? 404 : 400 });
  }
}, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN', 'AI_OFFICER'] });
