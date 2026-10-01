// ═══════════════════════════════════════════════════════════════
// CMS MANAGED CONTENT (Virtual Editor — site-wide & CRM content)
// ═══════════════════════════════════════════════════════════════
// Backing store for the §15 "Virtual Editor" content types that are
// not naturally one-Prisma-model-per-type: navigation, footer,
// seo-meta, announcements, banners, crm-labels, crm-templates and
// crm-widgets.
//
// Every create/update/publish/delete is snapshotted into
// CmsRevision (entityType 'cmsManagedContent') so the Virtual
// Editor gets draft → preview → publish → rollback with full
// history, publish timestamps and publishing user. Inputs are
// sanitized (no scripts/event handlers/js: URLs) — never arbitrary
// unsanitized HTML/JS.
// ═══════════════════════════════════════════════════════════════
import { db } from '@/lib/db';
import {
  sanitizeCmsInput,
  captureBeforeImage,
  captureAfterImage,
  rollbackTo,
  listRevisions,
  getRevision,
} from '@/lib/cms-revisions';

export const MANAGED_CONTENT_TYPES = [
  'navigation',
  'footer',
  'seo-meta',
  'announcement',
  'banner',
  'crm-label',
  'crm-template',
  'crm-widget',
] as const;
export type ManagedContentType = (typeof MANAGED_CONTENT_TYPES)[number];

export interface ManagedContentRow {
  id?: string;
  contentType: ManagedContentType;
  key?: string;
  section?: string;
  label?: string;
  data: Record<string, unknown>;
  status?: 'draft' | 'published';
  sortOrder?: number;
}

const ENTITY = 'cmsManagedContent';

function isManagedType(v: string): v is ManagedContentType {
  return (MANAGED_CONTENT_TYPES as readonly string[]).includes(v);
}

export function validateManagedContent(row: ManagedContentRow): string | null {
  if (!isManagedType(row.contentType)) {
    return `contentType must be one of: ${MANAGED_CONTENT_TYPES.join(', ')}`;
  }
  if (!row.data || typeof row.data !== 'object' || Array.isArray(row.data)) {
    return 'data must be a JSON object';
  }
  if (row.contentType === 'navigation' || row.contentType === 'footer') {
    const href = String(row.data.href ?? '');
    if (href && !href.startsWith('/') && !/^https?:\/\//.test(href) && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
      return 'navigation/footer items need a valid href (relative, http(s), #anchor, mailto: or tel:)';
    }
  }
  if (row.contentType === 'seo-meta') {
    const keys = Object.keys(row.data);
    const allowed = ['title', 'description', 'canonical', 'ogTitle', 'ogDescription', 'ogImage', 'ogImageAlt', 'keywords'];
    if (!keys.some((k) => allowed.includes(k))) {
      return `seo-meta data must include at least one of: ${allowed.join(', ')}`;
    }
  }
  if (row.contentType === 'announcement' || row.contentType === 'banner') {
    const message = String(row.data.message ?? row.data.title ?? '');
    if (!message.trim()) return 'announcements/banners need a message (or title)';
  }
  if (row.contentType === 'crm-label') {
    if (!String(row.key ?? '').trim() && !String(row.label ?? '').trim()) {
      return 'crm-label needs a key (lookup identifier) or label';
    }
  }
  if (row.contentType === 'crm-template') {
    if (!String(row.label ?? '').trim()) return 'crm-template needs a label (template name)';
    if (!String(row.data.body ?? '').trim()) return 'crm-template needs a body';
  }
  return null;
}

/** Create a new item (starts as draft until published). */
export async function createManagedContent(row: ManagedContentRow, actor: string) {
  const problem = validateManagedContent(row);
  if (problem) throw new Error(problem);
  const created = await db.cmsManagedContent.create({
    data: {
      contentType: row.contentType,
      key: sanitizeCmsInput(String(row.key ?? '')),
      section: sanitizeCmsInput(String(row.section ?? '')),
      label: sanitizeCmsInput(String(row.label ?? '')),
      data: sanitizeCmsInput(row.data ?? {}) as object,
      status: 'draft',
      sortOrder: Number(row.sortOrder ?? 0),
      createdById: actor,
    },
  });
  await captureAfterImage(ENTITY, created.id, actor, 'AUTO', 'created (draft)');
  return created;
}

/** Update an item (works on drafts and published alike; snapshot first). */
export async function updateManagedContent(id: string, patch: Partial<ManagedContentRow>, actor: string) {
  await captureBeforeImage(ENTITY, id, actor);
  const existing = await db.cmsManagedContent.findUnique({ where: { id } });
  if (!existing) throw new Error('Not found');
  const merged: ManagedContentRow = {
    contentType: existing.contentType as ManagedContentType,
    key: patch.key ?? existing.key,
    section: patch.section ?? existing.section,
    label: patch.label ?? existing.label,
    data: { ...(existing.data as Record<string, unknown>), ...(patch.data ?? {}) },
    sortOrder: patch.sortOrder ?? existing.sortOrder,
  };
  const problem = validateManagedContent(merged);
  if (problem) throw new Error(problem);
  const updated = await db.cmsManagedContent.update({
    where: { id },
    data: {
      key: sanitizeCmsInput(String(merged.key)),
      section: sanitizeCmsInput(String(merged.section)),
      label: sanitizeCmsInput(String(merged.label)),
      data: sanitizeCmsInput(merged.data ?? {}) as object,
      sortOrder: Number(merged.sortOrder ?? 0),
    },
  });
  await captureAfterImage(ENTITY, id, actor, 'AUTO', 'updated');
  return updated;
}

/** Publish a draft (records who published and when). */
export async function publishManagedContent(id: string, actor: string) {
  await captureBeforeImage(ENTITY, id, actor);
  const published = await db.cmsManagedContent.update({
    where: { id },
    data: { status: 'published', publishedAt: new Date(), publishedBy: actor },
  });
  await captureAfterImage(ENTITY, id, actor, 'PUBLISHED', 'published');
  return published;
}

/** Unpublish (back to draft — reversible, nothing is destroyed). */
export async function unpublishManagedContent(id: string, actor: string) {
  await captureBeforeImage(ENTITY, id, actor);
  const unpublished = await db.cmsManagedContent.update({
    where: { id },
    data: { status: 'draft' },
  });
  await captureAfterImage(ENTITY, id, actor, 'AUTO', 'unpublished');
  return unpublished;
}

/** Delete = snapshot + remove row (restorable from revision history). */
export async function deleteManagedContent(id: string, actor: string) {
  await captureBeforeImage(ENTITY, id, actor);
  await db.cmsManagedContent.delete({ where: { id } });
  return { deleted: true };
}

/** Rollback to a previous snapshot (the current state is snapshotted first). */
export async function rollbackManagedContent(revisionId: string, actor: string) {
  return rollbackTo(revisionId, actor);
}

export async function listManagedContent(opts: { contentType?: string; status?: string }) {
  const where: Record<string, unknown> = {};
  if (opts.contentType && isManagedType(opts.contentType)) where.contentType = opts.contentType;
  if (opts.status === 'draft' || opts.status === 'published') where.status = opts.status;
  return db.cmsManagedContent.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    take: 500,
  });
}

/** Public read: published items only, for a given content type. */
export async function getPublishedContent(contentType: string, key?: string) {
  if (!isManagedType(contentType)) return [];
  const where: Record<string, unknown> = { contentType, status: 'published' };
  if (key) where.key = key;
  return db.cmsManagedContent.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    take: 200,
    select: { id: true, key: true, section: true, label: true, data: true, sortOrder: true, publishedAt: true },
  });
}

export async function listManagedRevisions(id: string) {
  return listRevisions(ENTITY, id);
}

export async function getManagedRevision(revisionId: string) {
  return getRevision(revisionId);
}

/**
 * Server-side SEO defaults for the root layout (§15 SEO content).
 * Reads the published 'seo-meta' record with key 'site-defaults'.
 * Returns null when the DB is unreachable (e.g. build-time
 * prerender without a database) so callers can fall back to the
 * compiled-in defaults — never throws.
 */
export async function getSiteSeoDefaults(): Promise<{
  title?: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
} | null> {
  // explicit opt-out (build-time prerender without a database)
  if (process.env.SKIP_CMS_DB === '1') return null;
  try {
    // never let a slow/unreachable database stall metadata generation
    const rows = await Promise.race([
      getPublishedContent('seo-meta', 'site-defaults'),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('seo timeout')), 2500)),
    ]);
    const row = rows[0];
    if (!row) return null;
    const d = (row.data ?? {}) as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
    return {
      title: str(d.title),
      description: str(d.description),
      canonical: str(d.canonical),
      ogTitle: str(d.ogTitle),
      ogDescription: str(d.ogDescription),
      ogImage: str(d.ogImage),
    };
  } catch {
    return null;
  }
}
