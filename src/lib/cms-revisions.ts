// ============================================================
// CMS REVISIONS — Virtual Editor version-history service
//
// Extends the existing /api/admin/website/cms (Super Admin Website
// CMS) with draft / preview / publish / rollback / audit:
//
//   • AUTO revisions — before-images captured on every CMS update
//     and delete, giving every live row a full revision trail.
//   • DRAFT revisions — unpublished content; the live row is only
//     touched when a SUPER_ADMIN/ADMIN explicitly publishes.
//   • publish — applies a draft snapshot to the live row (creating
//     the row when the draft targets a new entity).
//   • rollback — re-applies any prior snapshot; the pre-rollback
//     state is itself captured, so rollbacks are reversible.
//
// Field safety is driven by the Prisma DMMF: only known scalar
// fields of the mapped model are ever written. All string input is
// sanitized (script/iframe/onevent/javascript: removal) before it
// can be stored.
// ============================================================
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';

export type CmsRevisionKind = 'AUTO' | 'DRAFT' | 'PUBLISHED' | 'ROLLBACK';

/** CMS type key -> Prisma model delegate name (mirrors the CMS API map). */
export const CMS_ENTITY_MODELS: Record<string, string> = {
  'hero-slides': 'homeHeroSlide',
  'home-services': 'homeService',
  'success-stories': 'successStory',
  'team-members': 'teamMember',
  'faqs': 'homepageFaq',
  'home-sections': 'homeSection',
  'english-tests': 'websiteEnglishTest',
  'countries': 'country',
  'country-quick-facts': 'countryQuickFact',
  'country-cities': 'countryCity',
  'country-pathways': 'countryEducationPathway',
  'country-reasons': 'countryStudyReason',
  'country-entry-reqs': 'countryEntryRequirement',
  'country-english-tests': 'countryEnglishTest',
  'country-visa-steps': 'countryVisaStep',
  'country-work-rights': 'countryWorkRight',
  'country-faqs': 'countryFaq',
  'country-sources': 'countrySource',
  'services': 'service',
  'service-faqs': 'serviceFaq',
  // Virtual Editor — site-wide & CRM managed content (generic store)
  'cmsManagedContent': 'cmsManagedContent',
};

const REVISION_LIMIT = 50;

function modelDelegate(model: string): any {
  const delegate = (db as any)[model];
  if (!delegate || typeof delegate.findUnique !== 'function') {
    throw new Error(`Unknown CMS entity model: ${model}`);
  }
  return delegate;
}

/** DMMF scalar fields for a model (writable, non-id). */
export function scalarFields(model: string): string[] {
  const dmmfModel = Prisma.dmmf.datamodel.models.find((m) =>
    m.name.toLowerCase() === model.toLowerCase()
  );
  if (!dmmfModel) throw new Error(`Unknown prisma model: ${model}`);
  return dmmfModel.fields
    .filter((f) => f.kind === 'scalar' && f.name !== 'id')
    .map((f) => f.name);
}

/** True when the field is a DateTime scalar on the model. */
function isDateTimeField(model: string, field: string): boolean {
  const dmmfModel = Prisma.dmmf.datamodel.models.find((m) =>
    m.name.toLowerCase() === model.toLowerCase()
  );
  const f = dmmfModel?.fields.find((x) => x.name === field);
  return !!f && f.type === 'DateTime' && f.kind === 'scalar';
}

// ─── Sanitization (XSS defense-in-depth) ─────────────────────
const DANGEROUS_BLOCKS = /<\s*(script|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;
const DANGEROUS_TAGS = /<\/?\s*(script|iframe|object|embed)[^>]*>/gi;
const EVENT_HANDLERS = /\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_URLS = /javascript\s*:/gi;

/** Recursively sanitize every string in a CMS payload. */
export function sanitizeCmsInput<T>(value: T): T {
  if (typeof value === 'string') {
    return value
      .replace(DANGEROUS_BLOCKS, '')
      .replace(DANGEROUS_TAGS, '')
      .replace(EVENT_HANDLERS, '')
      .replace(JS_URLS, '') as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeCmsInput(v)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitizeCmsInput(v);
    }
    return out as unknown as T;
  }
  return value;
}

// ─── Snapshots ───────────────────────────────────────────────
/** JSON-safe snapshot of a live row (dates -> ISO strings). */
function toSnapshot(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = v instanceof Date ? v.toISOString() : v;
  }
  return out;
}

/** Filter a snapshot to writable scalar fields of the target model. */
export function filterWritable(model: string, snapshot: Record<string, unknown>): Record<string, unknown> {
  const allowed = new Set(scalarFields(model));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(snapshot || {})) {
    if (!allowed.has(k)) continue;
    if (isDateTimeField(model, k) && typeof v === 'string') {
      const d = new Date(v);
      out[k] = isNaN(d.getTime()) ? undefined : d;
    } else {
      out[k] = v;
    }
  }
  // never allow id/createdAt injection through snapshots
  delete out.id;
  delete out.createdAt;
  return out;
}

// ─── Revision capture ────────────────────────────────────────
/** Capture the current live row as an AUTO before-image. No-op when the row is gone. */
export async function captureBeforeImage(entityType: string, entityId: string, actor: string): Promise<boolean> {
  const model = CMS_ENTITY_MODELS[entityType];
  if (!model || !entityId) return false;
  const row = await modelDelegate(model).findUnique({ where: { id: entityId } });
  if (!row) return false;
  await db.cmsRevision.create({
    data: {
      entityType,
      entityId,
      kind: 'AUTO',
      label: 'before update/delete',
      snapshot: toSnapshot(row) as object,
      createdBy: actor || 'system',
    },
  });
  return true;
}

// ─── Draft lifecycle ─────────────────────────────────────────
/**
 * Capture an AFTER image of a live row (symmetric with captureBeforeImage).
 * Used by the managed-content lifecycle so every create/update/publish
 * leaves a revision record, not just destructive changes.
 */
export async function captureAfterImage(
  entityType: string,
  entityId: string,
  actor: string,
  kind: 'AUTO' | 'DRAFT' | 'PUBLISHED' | 'ROLLBACK' = 'AUTO',
  label = 'after change'
): Promise<boolean> {
  const model = CMS_ENTITY_MODELS[entityType];
  if (!model || !entityId) return false;
  const row = await modelDelegate(model).findUnique({ where: { id: entityId } });
  if (!row) return false;
  await db.cmsRevision.create({
    data: {
      entityType,
      entityId,
      kind,
      label: label.slice(0, 180),
      snapshot: toSnapshot(row) as object,
      createdBy: actor || 'system',
    },
  });
  return true;
}

export async function saveDraft(params: {
  entityType: string;
  entityId?: string;
  data: Record<string, unknown>;
  label?: string;
  actor: string;
}) {
  const model = CMS_ENTITY_MODELS[params.entityType];
  if (!model) throw new Error(`Unknown CMS entity type: ${params.entityType}`);
  const sanitized = sanitizeCmsInput(params.data);
  const writable = filterWritable(model, sanitized);
  if (Object.keys(writable).length === 0) throw new Error('Draft has no writable fields');
  return db.cmsRevision.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId || '',
      kind: 'DRAFT',
      label: (params.label || '').slice(0, 180),
      snapshot: writable as object,
      createdBy: params.actor || 'unknown',
    },
  });
}

export async function listRevisions(entityType: string, entityId: string) {
  return db.cmsRevision.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: 'desc' },
    take: REVISION_LIMIT,
    select: {
      id: true, entityType: true, entityId: true, kind: true, label: true,
      createdBy: true, createdAt: true, publishedAt: true, publishedBy: true,
    },
  });
}

export async function getRevision(revisionId: string) {
  return db.cmsRevision.findUnique({ where: { id: revisionId } });
}

/** SUPER_ADMIN/ADMIN preview: returns the draft snapshot only (never mutates the live row). */
export async function previewRevision(revisionId: string) {
  const revision = await getRevision(revisionId);
  if (!revision) throw new Error('Revision not found');
  return {
    revisionId: revision.id,
    entityType: revision.entityType,
    entityId: revision.entityId,
    kind: revision.kind,
    label: revision.label,
    createdAt: revision.createdAt,
    snapshot: revision.snapshot,
  };
}

/** Apply a snapshot to the live row (update, or create when missing). */
async function applySnapshot(entityType: string, entityId: string, snapshot: Record<string, unknown>) {
  const model = CMS_ENTITY_MODELS[entityType];
  const data = filterWritable(model, snapshot);
  const delegate = modelDelegate(model);
  if (entityId) {
    const existing = await delegate.findUnique({ where: { id: entityId } });
    if (existing) {
      return delegate.update({ where: { id: entityId }, data });
    }
    // row deleted since the revision — re-create it (rollback of deletes)
    return delegate.create({ data: { ...data, id: entityId } });
  }
  return delegate.create({ data });
}

/**
 * Publish a DRAFT revision: capture the live row's before-image, apply the
 * draft, then mark the revision published with timestamp + publishing user.
 */
export async function publishDraft(revisionId: string, actor: string) {
  const revision = await getRevision(revisionId);
  if (!revision) throw new Error('Revision not found');
  if (revision.kind !== 'DRAFT') throw new Error('Only DRAFT revisions can be published');
  await captureBeforeImage(revision.entityType, revision.entityId, actor);
  const row = await applySnapshot(
    revision.entityType,
    revision.entityId,
    revision.snapshot as Record<string, unknown>
  );
  const applied = await db.cmsRevision.update({
    where: { id: revisionId },
    data: { kind: 'PUBLISHED', publishedAt: new Date(), publishedBy: actor },
  });
  return { revision: applied, row };
}

/**
 * Roll back to any revision snapshot. The current live state is captured
 * first, so a rollback is itself reversible.
 */
export async function rollbackTo(revisionId: string, actor: string) {
  const revision = await getRevision(revisionId);
  if (!revision) throw new Error('Revision not found');
  if (!revision.entityId) throw new Error('Revision has no target entity; publish it as a draft instead');
  await captureBeforeImage(revision.entityType, revision.entityId, actor);
  const row = await applySnapshot(
    revision.entityType,
    revision.entityId,
    revision.snapshot as Record<string, unknown>
  );
  const rollbackRecord = await db.cmsRevision.create({
    data: {
      entityType: revision.entityType,
      entityId: revision.entityId,
      kind: 'ROLLBACK',
      label: `rollback to ${revision.id}`,
      snapshot: revision.snapshot as object,
      createdBy: actor,
    },
  });
  return { rollbackRecord, row };
}
