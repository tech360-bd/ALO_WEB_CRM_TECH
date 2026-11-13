import { db } from '@/lib/db';
import { PhdAccessError, canAccessProject, type PhdActor } from '../auth';
import { DOCUMENT_TYPES } from '../constants';
import { recordPhdAudit } from '../audit';
import type { ApplicationStatus } from '../constants';

async function writableProject(actor: PhdActor, projectId: string) {
  const project = await db.phdProject.findUnique({ where: { id: projectId } });
  if (!project || !canAccessProject(actor, project, 'write')) {
    throw new PhdAccessError('Project not found or access denied.', 404);
  }
  return project;
}

export async function createApplication(actor: PhdActor, input: {
  projectId: string;
  programmeId: string;
  topicId?: string | null;
  proposalId?: string | null;
  supervisorId?: string | null;
  status?: string;
  notes?: string | null;
}) {
  await writableProject(actor, input.projectId);
  const programme = await db.phdProgramme.findUnique({ where: { id: input.programmeId }, include: { university: true } });
  if (!programme) throw new PhdAccessError('Programme not found.', 404);

  if (input.proposalId) {
    const proposal = await db.phdProposal.findUnique({ where: { id: input.proposalId } });
    if (!proposal || proposal.projectId !== input.projectId) throw new PhdAccessError('The proposal does not belong to this project.', 422);
  }
  if (input.topicId) {
    const topic = await db.phdTopicCandidate.findUnique({ where: { id: input.topicId } });
    if (!topic || topic.projectId !== input.projectId) throw new PhdAccessError('The topic does not belong to this project.', 422);
  }
  if (input.supervisorId) {
    const match = await db.phdSupervisorMatch.findFirst({ where: { supervisorId: input.supervisorId, projectId: input.projectId } });
    if (!match) throw new PhdAccessError('Record a supervisor match for this project before linking the supervisor.', 422);
  }

  const existing = await db.phdApplication.findUnique({
    where: { projectId_universityId_programmeId: { projectId: input.projectId, universityId: programme.universityId, programmeId: programme.id } },
  });
  if (existing) {
    throw new PhdAccessError('An application already exists for this university and programme in this project.', 409);
  }

  const application = await db.phdApplication.create({
    data: {
      projectId: input.projectId,
      universityId: programme.universityId,
      programmeId: programme.id,
      topicId: input.topicId ?? null,
      proposalId: input.proposalId ?? null,
      supervisorId: input.supervisorId ?? null,
      status: input.status ?? 'RESEARCHING',
      sourceUrl: programme.officialUrl,
      verificationStatus: programme.verificationStatus,
      offerConditions: '',
      notes: input.notes ?? '',
    },
    include: { university: true, programme: true },
  });
  await recordPhdAudit({ actor, action: 'APPLICATION_CREATED', entityType: 'PhdApplication', entityId: application.id, projectId: input.projectId, details: { programmeId: programme.id } });
  return application;
}

export async function updateApplication(actor: PhdActor, applicationId: string, input: Record<string, unknown>) {
  const application = await db.phdApplication.findUnique({ where: { id: applicationId }, include: { project: true } });
  if (!application || !canAccessProject(actor, application.project, 'write')) {
    throw new PhdAccessError('Application not found or access denied.', 404);
  }
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    if (['submittedAt', 'interviewAt', 'nextActionDueAt'].includes(key)) {
      data[key] = value ? new Date(String(value)) : null;
    } else {
      data[key] = value;
    }
  }
  const updated = await db.phdApplication.update({
    where: { id: applicationId },
    data,
    include: { university: true, programme: true },
  });
  await recordPhdAudit({
    actor,
    action: 'APPLICATION_UPDATED',
    entityType: 'PhdApplication',
    entityId: applicationId,
    projectId: application.projectId,
    details: { fields: Object.keys(data).join(','), status: String(data.status ?? application.status) },
  });
  return updated;
}

export async function listApplications(actor: PhdActor, projectId: string) {
  const project = await db.phdProject.findUnique({ where: { id: projectId } });
  if (!project || !canAccessProject(actor, project, 'read')) {
    throw new PhdAccessError('Project not found or access denied.', 404);
  }
  return db.phdApplication.findMany({
    where: { projectId },
    include: {
      university: true,
      programme: true,
      tasks: { orderBy: { dueAt: 'asc' } },
      documents: { where: { deletedAt: null } },
      deadlines: { orderBy: { dueDate: 'asc' } },
      proposal: { select: { id: true, title: true, currentVersion: true } },
      supervisor: { select: { id: true, fullName: true, availabilityStatus: true } },
      topic: { select: { id: true, workingTitle: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getApplication(actor: PhdActor, applicationId: string) {
  const application = await db.phdApplication.findUnique({
    where: { id: applicationId },
    include: {
      project: true,
      university: true,
      programme: true,
      tasks: { orderBy: { dueAt: 'asc' } },
      documents: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } },
      deadlines: { orderBy: { dueDate: 'asc' } },
      proposal: { include: { sections: { orderBy: { sortOrder: 'asc' } }, versions: { orderBy: { version: 'desc' } } } },
      supervisor: true,
      topic: true,
    },
  });
  if (!application || !canAccessProject(actor, application.project, 'read')) {
    throw new PhdAccessError('Application not found or access denied.', 404);
  }
  return application;
}

export async function addApplicationTask(actor: PhdActor, applicationId: string, input: {
  title: string; category?: string; dueAt?: string | null; status?: string; notes?: string | null;
}) {
  const application = await db.phdApplication.findUnique({ where: { id: applicationId }, include: { project: true } });
  if (!application || !canAccessProject(actor, application.project, 'write')) {
    throw new PhdAccessError('Application not found or access denied.', 404);
  }
  const task = await db.phdApplicationTask.create({
    data: {
      applicationId,
      title: input.title,
      category: input.category ?? 'OTHER',
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
      status: input.status ?? 'OPEN',
      notes: input.notes ?? '',
    },
  });
  await recordPhdAudit({ actor, action: 'APPLICATION_TASK_ADDED', entityType: 'PhdApplicationTask', entityId: task.id, projectId: application.projectId });
  return task;
}

export async function updateTaskStatus(actor: PhdActor, taskId: string, status: 'OPEN' | 'DONE' | 'BLOCKED' | 'CANCELLED') {
  const task = await db.phdApplicationTask.findUnique({
    where: { id: taskId },
    include: { application: { include: { project: true } } },
  });
  if (!task || !canAccessProject(actor, task.application.project, 'write')) {
    throw new PhdAccessError('Task not found or access denied.', 404);
  }
  const updated = await db.phdApplicationTask.update({ where: { id: taskId }, data: { status } });
  await recordPhdAudit({ actor, action: 'APPLICATION_TASK_STATUS', entityType: 'PhdApplicationTask', entityId: taskId, projectId: task.application.projectId, details: { status } });
  return updated;
}

/**
 * The checklist is derived from recorded programme requirements. When those
 * requirements are not verified, the fallback list is *explicitly* labelled
 * as suggested rather than mandatory.
 */
export async function applicationChecklist(actor: PhdActor, applicationId: string) {
  const application = await getApplication(actor, applicationId);
  const programme = application.programme;
  const requirements = await db.phdDocumentRequirement.findMany({ where: { programmeId: programme.id } });
  const documents = application.documents;
  const verified = programme.verificationStatus === 'VERIFIED_OFFICIAL' && requirements.length > 0;

  const items = verified
    ? requirements.map((requirement) => {
        const matching = documents.find((document) =>
          document.requirementId === requirement.id || document.documentType === requirement.documentType,
        );
        return {
          requirementId: requirement.id,
          documentType: requirement.documentType,
          label: requirement.documentType.replaceAll('_', ' ').toLowerCase(),
          mandatory: requirement.mandatory,
          sourceUrl: requirement.sourceUrl,
          verificationStatus: requirement.verificationStatus,
          provided: Boolean(matching),
          documentId: matching?.id ?? null,
          documentStatus: matching?.status ?? null,
        };
      })
    : DOCUMENT_TYPES.filter((type) => type !== 'OTHER').map((type) => {
        const matching = documents.find((document) => document.documentType === type);
        return {
          requirementId: null,
          documentType: type,
          label: type.replaceAll('_', ' ').toLowerCase(),
          mandatory: false,
          sourceUrl: programme.officialUrl,
          verificationStatus: 'NOT_YET_VERIFIED',
          provided: Boolean(matching),
          documentId: matching?.id ?? null,
          documentStatus: matching?.status ?? null,
        };
      });

  const mandatory = items.filter((item) => item.mandatory);
  return {
    verified,
    label: verified
      ? 'Checklist derived from verified programme requirements.'
      : 'Suggested checklist only — the programme’s official document requirements have not been verified. Do not treat any item as mandatory until confirmed.',
    programmeRequirementStatus: programme.verificationStatus,
    sourceUrl: programme.officialUrl,
    items,
    summary: {
      total: items.length,
      provided: items.filter((item) => item.provided).length,
      mandatoryTotal: mandatory.length,
      mandatoryMissing: mandatory.filter((item) => !item.provided).length,
    },
  };
}
