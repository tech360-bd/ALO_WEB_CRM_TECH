/**
 * Pure analysis helpers for the admin data-review / duplicates screens.
 * They only group real records; they never invent or resolve anything.
 */
import { canonicalValue, normalizeInstitutionName } from './import-diff';

export interface UniversityLite { universityId: string; name: string; country?: string | null; website?: string | null; officialUrl?: string | null; verificationStatus?: string | null; publicationStatus?: string | null }
export interface CourseLite { courseId: string; universityId: string; courseTitle?: string | null; name?: string | null; studyLevel?: string | null; verificationStatus?: string | null }
export interface IntakeLite { id: string; courseId: string; intakeYear: number; intakeMonth: string; verificationStatus?: string | null }

export interface DuplicateGroup<T> { reason: string; key: string; records: T[] }

function hostOf(url?: string | null): string {
  if (!url) return '';
  return canonicalValue(url, 'url').split('/')[0];
}

function groupsOf<T>(items: T[], keyFn: (t: T) => string, reason: string): DuplicateGroup<T>[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = keyFn(item);
    if (!k) continue;
    const list = map.get(k) ?? [];
    list.push(item);
    map.set(k, list);
  }
  return [...map.entries()].filter(([, v]) => v.length > 1).map(([key, records]) => ({ reason, key, records }));
}

/** Same matcher rules as the import (findProbableDuplicate): same website host, or same normalised name in the same country. */
export function universityDuplicateGroups(unis: UniversityLite[]): DuplicateGroup<UniversityLite>[] {
  const byHost = groupsOf(unis, (u) => hostOf(u.website || u.officialUrl), 'Same website host');
  const byName = groupsOf(unis, (u) => {
    const n = normalizeInstitutionName(u.name || '');
    return n ? `${n}|${(u.country || '').trim().toLowerCase()}` : '';
  }, 'Same normalised name and country');
  // Drop name groups that are exactly the same set as a host group.
  const hostSets = new Set(byHost.map((g) => g.records.map((r) => r.universityId).sort().join(',')));
  return [...byHost, ...byName.filter((g) => !hostSets.has(g.records.map((r) => r.universityId).sort().join(',')))];
}

export function courseDuplicateGroups(courses: CourseLite[]): DuplicateGroup<CourseLite>[] {
  return groupsOf(courses, (c) => {
    const t = normalizeInstitutionName(c.courseTitle || c.name || '');
    return t ? `${c.universityId}|${t}|${(c.studyLevel || '').trim().toLowerCase()}` : '';
  }, 'Same university, title and study level');
}

/** Intake rows that would violate a future @@unique([courseId, intakeYear, intakeMonth]). */
export function intakeDuplicateGroups(intakes: IntakeLite[]): DuplicateGroup<IntakeLite>[] {
  return groupsOf(intakes, (i) => `${i.courseId}|${i.intakeYear}|${canonicalValue(i.intakeMonth, 'month')}`, 'Same course, year and month');
}

/** Turns Prisma groupBy output into a plain { value: count } map. */
export function countMap(rows: Array<Record<string, any>>, field: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const key = r[field] === null || r[field] === undefined || r[field] === '' ? '(blank)' : String(r[field]);
    out[key] = (out[key] ?? 0) + Number(r._count?._all ?? r._count ?? 0);
  }
  return out;
}
