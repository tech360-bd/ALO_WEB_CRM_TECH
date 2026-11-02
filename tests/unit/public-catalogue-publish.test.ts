/**
 * Regression: approved catalogue data must be able to pass the PUBLIC gate.
 *
 * The approval flow (src/lib/verified-catalogue/publish.ts) wrote
 * `status: 'published_verified'` while the public catalogue requires
 * `status: 'active'`, so a Super Admin could approve a course and still never
 * see it on /course-finder, /courses or the sitemap. The parent university also
 * stayed on ingest's `verified_pending_approval` status, and
 * `publicCourseWhere()` requires a public university, which hid every course of
 * that university as well.
 *
 * These tests evaluate the Prisma-style `where` objects produced by the real
 * public gate against the real publication patch, so the writer and the reader
 * cannot drift apart again.
 */
import { describe, expect, it } from 'vitest';
import { coursePublicationPatch, universityPublicationPatch } from '@/lib/verified-catalogue/publish';
import { publicCourseWhere, publicUniversityWhere } from '@/lib/public-catalog';

type Rec = Record<string, any>;

/** Minimal matcher for the operators the public gate uses. */
function matches(rec: Rec, where: any): boolean {
  if (!where) return true;
  return Object.entries(where).every(([key, value]: [string, any]) => {
    if (key === 'AND') return (value as any[]).every((w) => matches(rec, w));
    if (key === 'OR') return (value as any[]).some((w) => matches(rec, w));
    if (key === 'NOT') return !matches(rec, value);
    const actual = rec[key];
    if (value && typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value)) {
      if ('is' in value) return matches(actual ?? {}, value.is);
      return Object.entries(value).every(([op, arg]: [string, any]) => {
        if (op === 'startsWith') return typeof actual === 'string' && actual.startsWith(arg);
        if (op === 'contains') return typeof actual === 'string' && actual.includes(arg);
        if (op === 'in') return arg.includes(actual);
        if (op === 'notIn') return !arg.includes(actual);
        if (op === 'not') return actual !== arg;
        throw new Error(`unsupported operator ${op}`);
      });
    }
    return actual === value;
  });
}

const NOW = new Date('2026-11-02T00:00:00.000Z');
const SOURCE = 'https://www.example.ac.uk/courses/msc-data-science';
const ACTOR = 'user-123';

describe('publication patch — course', () => {
  const patch = coursePublicationPatch(ACTOR, NOW);

  it('writes the canonical values the public gate requires', () => {
    expect(patch.status).toBe('active');
    expect(patch.publicationStatus).toBe('published');
    expect(patch.verificationStatus).toBe('VERIFIED');
    expect(patch.lastApprovedUpdateAt).toBe(NOW.toISOString());
    expect(patch.updatedBy).toBe(ACTOR);
  });

  it('produces a course that passes publicCourseWhere when its university is public', () => {
    const university = {
      id: 'u1',
      status: 'active',
      verificationStatus: 'VERIFIED',
      publicationStatus: 'published',
      sourceUrl: 'https://www.example.ac.uk',
      officialUrl: '',
    };
    const course = {
      id: 'c1',
      status: patch.status,
      verificationStatus: patch.verificationStatus,
      publicationStatus: patch.publicationStatus,
      sourceUrl: SOURCE,
      officialUrl: '',
      internationalEligibility: 'eligible',
      university,
    };
    expect(matches(course, publicCourseWhere())).toBe(true);
  });

  it('regression: the old status value kept approved courses hidden', () => {
    const university = {
      status: 'active',
      verificationStatus: 'VERIFIED',
      publicationStatus: 'published',
      sourceUrl: 'https://www.example.ac.uk',
      officialUrl: '',
    };
    const oldCourse = {
      status: 'published_verified',
      verificationStatus: 'VERIFIED',
      publicationStatus: 'published',
      sourceUrl: SOURCE,
      officialUrl: '',
      internationalEligibility: 'eligible',
      university,
    };
    expect(matches(oldCourse, publicCourseWhere())).toBe(false);
  });
});

describe('publication patch — university', () => {
  it('publishes a staged (verified_pending_approval) university so its courses can show', () => {
    const patch = universityPublicationPatch({ status: 'verified_pending_approval', publicationStatus: 'draft' }, ACTOR, NOW);
    expect(patch).not.toBeNull();
    const university = {
      status: patch!.status,
      verificationStatus: 'VERIFIED',
      publicationStatus: patch!.publicationStatus,
      sourceUrl: 'https://www.example.ac.uk',
      officialUrl: '',
    };
    expect(matches(university, publicUniversityWhere())).toBe(true);
  });

  it('never republishes an archived university', () => {
    expect(universityPublicationPatch({ status: 'archived', publicationStatus: 'archived' }, ACTOR, NOW)).toBeNull();
  });
});
