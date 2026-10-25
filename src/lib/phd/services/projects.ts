import { db } from '@/lib/db';
import { PhdAccessError, canAccessProject, type PhdActor } from '../auth';
import { recordPhdAudit } from '../audit';

export async function ensureDefaultProject(actor: PhdActor, title = 'My UK PhD research project') {
  const existing = await db.phdProject.findFirst({
    where: { userId: actor.userId, status: 'ACTIVE' },
    orderBy: { createdAt: 'asc' },
  });
  if (existing) return existing;
  const created = await db.phdProject.create({
    data: { userId: actor.userId, title, researchQuestion: '' },
  });
  await recordPhdAudit({
    actor,
    action: 'PROJECT_CREATED',
    entityType: 'PhdProject',
    entityId: created.id,
    projectId: created.id,
    details: { source: 'auto-provisioned' },
  });
  return created;
}

/**
 * Creates an additional research project for the signed-in applicant.
 * A per-user cap keeps the workspace navigable and prevents accidental bulk
 * creation; it is not a licence limit.
 */
export async function createProject(actor: PhdActor, title: string) {
  if (actor.role !== 'APPLICANT' && actor.role !== 'RESEARCH_ADVISER') {
    throw new PhdAccessError('Only a student can create a research project.', 403);
  }
  const active = await db.phdProject.count({ where: { userId: actor.userId, status: 'ACTIVE' } });
  if (active >= 10) throw new PhdAccessError('You already have 10 active research projects. Archive one before creating another.', 429);
  const created = await db.phdProject.create({
    data: { userId: actor.userId, title: title.slice(0, 200) || 'Untitled research project', researchQuestion: '' },
  });
  await recordPhdAudit({ actor, action: 'PROJECT_CREATED', entityType: 'PhdProject', entityId: created.id, projectId: created.id, details: { source: 'api' } });
  return created;
}

export async function listProjects(actor: PhdActor) {
  const where = actor.role === 'ADMINISTRATOR'
    ? { status: 'ACTIVE' }
    : actor.role === 'RESEARCH_ADVISER'
      ? { status: 'ACTIVE', OR: [{ userId: actor.userId }, { adviserId: actor.userId }] }
      : { status: 'ACTIVE', userId: actor.userId };
  return db.phdProject.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { topics: true, sources: true, proposals: true, applications: true } },
    },
  });
}

export async function getProjectForActor(actor: PhdActor, projectId: string, mode: 'read' | 'write' = 'read') {
  const project = await db.phdProject.findUnique({ where: { id: projectId } });
  if (!project || !canAccessProject(actor, project, mode)) {
    throw new PhdAccessError('Project not found or access denied.', 404);
  }
  return project;
}

export async function requireProjectByParam(actor: PhdActor, projectId: string | null, mode: 'read' | 'write' = 'read') {
  if (!projectId) return ensureDefaultProject(actor);
  return getProjectForActor(actor, projectId, mode);
}

export async function projectDetail(actor: PhdActor, projectId: string) {
  const project = await getProjectForActor(actor, projectId);
  const [topics, sources, proposals, applications, contacts, deadlines, matches] = await Promise.all([
    db.phdTopicCandidate.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' }, take: 30 }),
    db.phdLiteratureSource.count({ where: { projectId } }),
    db.phdProposal.findMany({ where: { projectId }, orderBy: { updatedAt: 'desc' }, take: 10 }),
    db.phdApplication.findMany({ where: { projectId }, include: { university: true, programme: true }, orderBy: { updatedAt: 'desc' } }),
    db.phdSupervisorContact.findMany({ where: { projectId }, include: { supervisor: true }, orderBy: { updatedAt: 'desc' } }),
    db.phdDeadline.findMany({ where: { projectId }, orderBy: { dueDate: 'asc' }, take: 30 }),
    db.phdSupervisorMatch.findMany({ where: { projectId }, include: { supervisor: true }, orderBy: { fitScore: 'desc' }, take: 20 }),
  ]);
  return { project, topics, sourceCount: sources, proposals, applications, contacts, deadlines, matches };
}
