import { createHash } from 'node:crypto';
import { db } from '@/lib/db';
import { PhdAccessError, canAccessProject, type PhdActor } from '../auth';
import { normaliseDoi, validateCitation } from '../proposals/citations';
import type { LiteratureSourceInput } from '../validation';
import { recordPhdAudit } from '../audit';

function dedupeKeyFor(projectId: string, input: LiteratureSourceInput): string {
  const identifier = normaliseDoi(input.doi) || input.url?.trim().toLowerCase() || `${input.title.trim().toLowerCase()}|${input.year ?? ''}`;
  return createHash('sha256').update(`${projectId}|${identifier}`).digest('hex').slice(0, 40);
}

async function requireProjectAccess(actor: PhdActor, projectId: string, mode: 'read' | 'write') {
  const project = await db.phdProject.findUnique({ where: { id: projectId } });
  if (!project || !canAccessProject(actor, project, mode)) {
    throw new PhdAccessError('Project not found or access denied.', 404);
  }
  return project;
}

export async function addLiteratureSource(actor: PhdActor, projectId: string, input: LiteratureSourceInput) {
  await requireProjectAccess(actor, projectId, 'write');
  const validation = validateCitation({
    title: input.title,
    authors: input.authors,
    year: input.year ?? null,
    venue: input.venue ?? '',
    publisher: input.publisher ?? '',
    doi: input.doi ?? null,
    url: input.url ?? null,
    sourceType: input.sourceType,
    verificationStatus: input.verificationStatus,
  });
  if (!validation.valid) {
    throw new PhdAccessError(`Citation could not be stored: ${validation.errors.join(' ')}`, 422);
  }
  const dedupeKey = dedupeKeyFor(projectId, input);
  const existing = await db.phdLiteratureSource.findUnique({ where: { dedupeKey } });
  if (existing) {
    return { source: existing, duplicate: true, validation };
  }
  const source = await db.phdLiteratureSource.create({
    data: {
      projectId,
      dedupeKey,
      title: input.title,
      authors: input.authors,
      year: input.year ?? null,
      venue: input.venue ?? '',
      publisher: input.publisher ?? '',
      doi: validation.normalisedDoi,
      url: input.url ?? null,
      sourceType: input.sourceType ?? 'JOURNAL_ARTICLE',
      abstract: input.abstract ?? '',
      notes: input.notes ?? '',
      researchQuestion: input.researchQuestion ?? '',
      methods: input.methods ?? '',
      findings: input.findings ?? '',
      limitations: input.limitations ?? '',
      relevance: input.relevance ?? '',
      supportDirection: input.supportDirection ?? 'SUPPORTS',
      accessedAt: new Date(),
      verificationStatus: input.verificationStatus ?? 'NOT_YET_VERIFIED',
      provenance: 'USER',
    },
  });
  await recordPhdAudit({
    actor,
    action: 'LITERATURE_SOURCE_ADDED',
    entityType: 'PhdLiteratureSource',
    entityId: source.id,
    projectId,
    details: { hasDoi: Boolean(source.doi), verificationStatus: source.verificationStatus },
  });
  return { source, duplicate: false, validation };
}

export async function listLiteratureSources(actor: PhdActor, projectId: string, options: {
  search?: string; verificationStatus?: string; page?: number; pageSize?: number;
} = {}) {
  await requireProjectAccess(actor, projectId, 'read');
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 25));
  const where = {
    projectId,
    ...(options.verificationStatus ? { verificationStatus: options.verificationStatus } : {}),
    ...(options.search
      ? {
          OR: [
            { title: { contains: options.search } },
            { authors: { contains: options.search } },
            { venue: { contains: options.search } },
            { doi: { contains: options.search } },
          ],
        }
      : {}),
  };
  const [total, sources, verified] = await Promise.all([
    db.phdLiteratureSource.count({ where }),
    db.phdLiteratureSource.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
    db.phdLiteratureSource.count({ where: { projectId, verificationStatus: 'VERIFIED_OFFICIAL' } }),
  ]);
  return { sources, total, page, pageSize, verified };
}

export async function getLiteratureSource(actor: PhdActor, sourceId: string) {
  const source = await db.phdLiteratureSource.findUnique({
    where: { id: sourceId },
    include: { project: true, claims: true, citations: true, document: true },
  });
  if (!source || (source.project.userId !== actor.userId && actor.role !== 'ADMINISTRATOR' && source.project.adviserId !== actor.userId)) {
    throw new PhdAccessError('Source not found or access denied.', 404);
  }
  return source;
}

export async function verifyLiteratureSource(actor: PhdActor, sourceId: string, status: 'VERIFIED_OFFICIAL' | 'SECONDARY_SOURCE_ONLY' | 'NOT_YET_VERIFIED') {
  const source = await getLiteratureSource(actor, sourceId);
  if (actor.role !== 'DATA_VERIFIER' && actor.role !== 'ADMINISTRATOR' && source.project.userId !== actor.userId) {
    throw new PhdAccessError('Only the owner or a verifier can change this source status.', 403);
  }
  const updated = await db.phdLiteratureSource.update({ where: { id: sourceId }, data: { verificationStatus: status } });
  await recordPhdAudit({ actor, action: 'LITERATURE_VERIFICATION_UPDATED', entityType: 'PhdLiteratureSource', entityId: sourceId, projectId: source.projectId, details: { status } });
  return updated;
}

export async function addEvidenceClaim(actor: PhdActor, projectId: string, input: {
  claim: string;
  sourceId?: string | null;
  supportType: 'VERIFIED_FACT' | 'SOURCE_REPORTED' | 'AI_SYNTHESIS' | 'HYPOTHESIS' | 'UNVERIFIED';
  location?: string;
  confidence?: 'LOW' | 'MEDIUM' | 'HIGH';
  notes?: string | null;
}) {
  if (input.sourceId) {
    const source = await db.phdLiteratureSource.findUnique({ where: { id: input.sourceId }, select: { projectId: true } });
    if (!source || source.projectId !== projectId) {
      throw new PhdAccessError('The linked source does not belong to this project.', 422);
    }
  }
  if (input.supportType === 'VERIFIED_FACT' && !input.sourceId) {
    throw new PhdAccessError('A “verified fact” claim requires a linked source record.', 422);
  }
  const claim = await db.phdEvidenceClaim.create({
    data: {
      projectId,
      sourceId: input.sourceId ?? null,
      claim: input.claim,
      supportType: input.supportType,
      location: input.location ?? '',
      confidence: input.confidence ?? 'LOW',
      notes: input.notes ?? '',
      verificationStatus: input.supportType === 'VERIFIED_FACT' ? 'VERIFIED_OFFICIAL' : 'NOT_YET_VERIFIED',
    },
  });
  await recordPhdAudit({ actor, action: 'EVIDENCE_CLAIM_ADDED', entityType: 'PhdEvidenceClaim', entityId: claim.id, projectId, details: { supportType: claim.supportType } });
  return claim;
}
