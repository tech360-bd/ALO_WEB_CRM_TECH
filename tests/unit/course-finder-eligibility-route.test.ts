import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  courseFindMany: vi.fn(),
  resultCreate: vi.fn(),
  authenticateRequest: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    crmCourse: { findMany: mocks.courseFindMany },
    finderEligibilityResult: { create: mocks.resultCreate },
  },
}));
vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: mocks.authenticateRequest }));
vi.mock('@/lib/rate-limiter', () => ({ rateLimitMiddleware: () => null }));

import { NextResponse } from 'next/server';
import { POST } from '@/app/api/course-finder/eligibility-engine/route';
import { publicIntakeWhere, publicCourseWhere } from '@/lib/public-catalog';

function course(overrides: Record<string, unknown> = {}) {
  return {
    id: 'row-1', courseId: 'CRS-PGT', courseTitle: 'MSc Data Science', slug: 'msc-data-science',
    universityId: 'UNI-1', country: 'United Kingdom', studyLevel: 'Postgraduate', programLevel: '',
    subjectArea: 'Data Science', qualification: 'MSc', internationalEligibility: 'yes',
    officialUrl: 'https://example.ac.uk/msc', sourceUrl: '', lastVerifiedAt: '2026-09-01',
    university: { name: 'Example University', country: 'United Kingdom', slug: 'example' },
    requirements: [{ minScore: '3.0/4.0', academicReq: "Bachelor's degree", ieltsOverall: 6.5, ieltsMinBand: 6, officialRequirementUrl: 'https://example.ac.uk/msc#entry', lastCheckedAt: '2026-09-01' }],
    intakeFees: [{ yearlyTuition: 20000, tuitionCurrency: 'GBP', feeSourceUrl: 'https://example.ac.uk/fees', lastCheckedAt: '2026-09-01' }],
    ...overrides,
  };
}

function request(body: unknown) {
  return new Request('http://localhost/api/course-finder/eligibility-engine', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
}

const profile = {
  academicProfile: [{ qualificationType: 'HSC', gpa: 5, gpaScale: 5 }],
  englishTests: [{ testType: 'IELTS Academic', overallScore: 7, listening: 7, reading: 7, writing: 7, speaking: 7, testDate: '2026-06-01' }],
  studyPreferences: { preferredCountries: ['UK'], preferredSubject: 'Data Science' },
  userId: 'victim-student-id',
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.authenticateRequest.mockResolvedValue(NextResponse.json({}, { status: 401 }));
});

describe('POST /api/course-finder/eligibility-engine', () => {
  it('queries only the canonical public catalogue, maps UK alias, and never reads fields that do not exist on CrmCourse', async () => {
    mocks.courseFindMany.mockResolvedValueOnce([course()]).mockResolvedValueOnce([]);
    const res = await POST(request(profile));
    expect(res.status).toBe(200);
    const first = mocks.courseFindMany.mock.calls[0][0];
    expect(first.where.AND[0]).toEqual(publicCourseWhere());
    const json = JSON.stringify(first.where);
    expect(json).toContain('United Kingdom');
    expect(json).not.toContain('specialisation');
    expect(first.select.requirements.where).toEqual({ verificationStatus: 'VERIFIED' });
    expect(first.select.intakeFees.where).toEqual(publicIntakeWhere());
  });

  it('returns the requirement table with sources and a NOT_CURRENTLY_ELIGIBLE reason for an HSC applicant to a master’s', async () => {
    mocks.courseFindMany.mockResolvedValueOnce([course()]).mockResolvedValueOnce([]);
    const body = await (await POST(request(profile))).json();
    const r = body.results[0];
    expect(r.eligibilityCategory).toBe('NOT_CURRENTLY_ELIGIBLE');
    expect(r.reason).toBeTruthy();
    expect(r.requirements.find((x: { key: string }) => x.key === 'academic_score').source).toBe('https://example.ac.uk/msc#entry');
    expect(body.disclaimers).toHaveLength(3);
  });

  it('offers alternatives only when they pass the same engine', async () => {
    const pathwayOk = course({ courseId: 'CRS-PM', courseTitle: 'Pre-Master’s Programme in Data Science', slug: 'pre-masters', studyLevel: 'Pre-Masters', requirements: [{ academicReq: "Bachelor's degree", minScore: '2.0/4.0', ieltsOverall: 5.5, lastCheckedAt: '2026-09-01' }] });
    const pathwayFail = course({ courseId: 'CRS-PM2', courseTitle: 'Pre-Master’s Business', slug: 'pm2', studyLevel: 'Pre-Masters', subjectArea: 'Data Science', requirements: [{ minScore: '3.5/4.0', ieltsOverall: 8.5, lastCheckedAt: '2026-09-01' }] });
    mocks.courseFindMany.mockResolvedValueOnce([course()]).mockResolvedValueOnce([pathwayOk, pathwayFail]);
    const body = await (await POST(request({ ...profile, academicProfile: [{ qualificationType: "Bachelor's", gpa: 2.2, gpaScale: 4 }] }))).json();
    expect(body.results[0].eligibilityCategory).toBe('NOT_CURRENTLY_ELIGIBLE');
    const alts = body.results[0].alternativeRoutes as Array<{ slug: string; eligibilityCategory: string }>;
    expect(alts.every((a) => ['ELIGIBLE', 'LIKELY_ELIGIBLE', 'CONDITIONALLY_ELIGIBLE'].includes(a.eligibilityCategory))).toBe(true);
    expect(alts.find((a) => a.slug === 'pm2')).toBeUndefined();
    expect(alts.map((a) => a.slug)).toContain('pre-masters');
    const poolQuery = mocks.courseFindMany.mock.calls[1][0];
    expect(poolQuery.where.AND[0]).toEqual(publicCourseWhere());
  });

  it('does not persist anonymous checks and ignores a body-supplied userId', async () => {
    mocks.courseFindMany.mockResolvedValueOnce([course()]).mockResolvedValueOnce([]);
    const body = await (await POST(request(profile))).json();
    expect(body.assessmentId).toBeNull();
    expect(mocks.resultCreate).not.toHaveBeenCalled();
  });

  it('persists for an authenticated student under the session identity only', async () => {
    mocks.authenticateRequest.mockResolvedValue({ userId: 'session-student', userType: 'STUDENT' });
    mocks.resultCreate.mockResolvedValue({ id: 'assess-1' });
    mocks.courseFindMany.mockResolvedValueOnce([course()]).mockResolvedValueOnce([]);
    const body = await (await POST(request(profile))).json();
    expect(body.assessmentId).toBe('assess-1');
    const data = mocks.resultCreate.mock.calls[0][0].data;
    expect(data.studentId).toBe('session-student');
    expect(JSON.stringify(data)).not.toContain('victim-student-id');
    expect(JSON.parse(data.result).ruleVersion).toMatch(/^alo-eligibility-rules-/);
  });

  it('rejects malformed bodies and hides internal error details', async () => {
    expect((await POST(new Request('http://localhost/x', { method: 'POST', body: 'not json' }))).status).toBe(400);
    expect((await POST(request([1, 2]))).status).toBe(400);
    mocks.courseFindMany.mockRejectedValueOnce(new Error('mysql://user:password@host'));
    const res = await POST(request(profile));
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain('mysql://');
  });

  it('reports an empty verified catalogue honestly instead of inventing results', async () => {
    mocks.courseFindMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    const body = await (await POST(request(profile))).json();
    expect(body.results).toEqual([]);
    expect(body.emptyCatalogue).toBe(true);
  });
});
