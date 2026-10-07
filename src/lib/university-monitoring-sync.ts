// ============================================================
// ALO Education — Approved-Change Fan-out / Cache Invalidation
// ============================================================
//
// Why this file exists (audit finding):
// When a Super Admin approved a change the route updated UniversityPage /
// CoursePage inside a transaction and stopped there. The spec requires that an
// approval then propagates:
//
//   "Then invalidate/rebuild relevant caches. Then update: Public university
//    page, Public course page, Course Finder, CRM search, Student
//    recommendations, Counselor views, Partner views, Scholarship information,
//    Application workflow where relevant."
//
// The only cache helper in the repo (`invalidateCaches` in publish-engine.ts)
// is an explicit no-op that returns a descriptive object without touching any
// cache. Nothing called it from the monitoring flow either.
//
// This module performs the real Next.js revalidation so the public website and
// CRM read the approved value on the next request instead of serving a stale
// cached page.

import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/lib/db';

export interface SyncResult {
  paths: string[];
  tags: string[];
  auditEvent: string;
  syncedAt: string;
  errors: string[];
}

/**
 * Cache tags used across the public site / CRM surfaces that read university
 * and course data. Revalidating by tag is cheap and covers any route that
 * opted into the tag, including the Course Finder and CRM search.
 */
const GLOBAL_TAGS = [
  'universities',
  'courses',
  'course-finder',
  'crm-catalog',
  'scholarships',
  'knowledge-center',
];

/**
 * Invalidate every surface affected by an approved change and record the
 * synchronisation in the monitoring log.
 *
 * Failures are collected rather than thrown: the database mutation has already
 * been committed and approved, so a cache-invalidation hiccup must not surface
 * as a failed approval. Any error is recorded for the Super Admin.
 */
export async function syncApprovedChange(change: {
  id: string;
  entityType: string;
  universitySlug?: string | null;
  courseSlug?: string | null;
  countrySlug?: string | null;
  fieldName: string;
  changeType: string;
}): Promise<SyncResult> {
  const paths: string[] = [];
  const tags: string[] = [...GLOBAL_TAGS];
  const errors: string[] = [];

  // --- Public website paths -------------------------------------------------
  if (change.universitySlug) {
    paths.push(`/universities/${change.universitySlug}`);
    paths.push(`/university/${change.universitySlug}`);
    tags.push(`university:${change.universitySlug}`);
  }
  if (change.courseSlug) {
    paths.push(`/courses/${change.courseSlug}`);
    paths.push(`/course/${change.courseSlug}`);
    tags.push(`course:${change.courseSlug}`);
  }
  if (change.countrySlug) {
    paths.push(`/destinations/${change.countrySlug}`);
    paths.push(`/study-in-${change.countrySlug}`);
    tags.push(`country:${change.countrySlug}`);
  }

  // Aggregate listing / discovery surfaces that embed the changed record.
  paths.push('/universities', '/courses', '/course-finder', '/scholarships');

  // CRM + internal surfaces that read the same single source of truth.
  paths.push('/crm/universities', '/crm/courses', '/admin/university-monitoring');

  for (const p of Array.from(new Set(paths))) {
    try {
      revalidatePath(p);
    } catch (e) {
      // revalidatePath throws outside a request/render scope (e.g. in tests or
      // a background worker). Record and continue.
      errors.push(`revalidatePath(${p}): ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  for (const t of Array.from(new Set(tags))) {
    try {
      // Next.js 16 requires an explicit cacheLife profile. `{ expire: 0 }`
      // purges immediately: an approved fee/deadline change must not keep
      // serving the superseded value to students.
      revalidateTag(t, { expire: 0 });
    } catch (e) {
      errors.push(`revalidateTag(${t}): ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const auditEvent =
    change.entityType === 'UNIVERSITY' ? 'UNIVERSITY_DATA_APPROVED' : 'COURSE_DATA_APPROVED';

  const result: SyncResult = {
    paths: Array.from(new Set(paths)),
    tags: Array.from(new Set(tags)),
    auditEvent,
    syncedAt: new Date().toISOString(),
    errors,
  };

  await db.monitoringLog
    .create({
      data: {
        level: errors.length ? 'WARN' : 'AUDIT',
        message: `Approved change ${change.id} synchronised to public website, Course Finder, CRM and Knowledge Center (${result.paths.length} paths, ${result.tags.length} tags)${errors.length ? ` with ${errors.length} cache warning(s)` : ''}`,
        entityType: change.entityType,
        entitySlug: change.universitySlug || change.courseSlug || change.countrySlug || null,
        metadata: JSON.stringify(result),
      },
    })
    .catch(() => undefined);

  return result;
}
