/**
 * Catalogue Phase 1 review (2026-10-12): P0-C public visibility + K4 proxy.
 *
 * `@/lib/db` is an in-memory fake whose findMany/findFirst/count evaluate the
 * Prisma-style `where` objects the routes build (AND/OR/NOT, equality,
 * startsWith, contains, in, notIn, not, relation `is`). This proves which
 * records each public surface WOULD request under the policy; it is not
 * MySQL proof (collation, NULL handling and Prisma's own validation are not
 * exercised).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

type Rec = Record<string, any>;
const h = vi.hoisted(() => ({ data: { universityPage: [] as any[], coursePage: [] as any[], dataConflict: [] as any[], crmCourse: [] as any[], crmScholarship: [] as any[] }, db: {} as any, auth: { current: null as any } }));

function matches(rec: Rec | null | undefined, where: any): boolean {
  if (!where) return true;
  if (!rec) return false;
  return Object.entries(where).every(([k, v]: [string, any]) => {
    if (k === 'AND') return (v as any[]).every((w) => matches(rec, w));
    if (k === 'OR') return (v as any[]).some((w) => matches(rec, w));
    if (k === 'NOT') return Array.isArray(v) ? !v.some((w) => matches(rec, w)) : !matches(rec, v);
    const val = rec[k];
    if (v && typeof v === 'object' && !(v instanceof Date) && !Array.isArray(v)) {
      if ('is' in v) return matches(val, v.is);
      if ('some' in v) return Array.isArray(val) && val.some((x: Rec) => matches(x, v.some));
      return Object.entries(v).every(([op, arg]: [string, any]) => {
        if (op === 'startsWith') return typeof val === 'string' && val.startsWith(arg);
        if (op === 'contains') return typeof val === 'string' && val.includes(arg);
        if (op === 'in') return arg.includes(val);
        if (op === 'notIn') return !arg.includes(val);
        if (op === 'not') return val !== arg;
        if (op === 'gte') return val instanceof Date && arg instanceof Date ? val.getTime() >= arg.getTime() : String(val ?? '') >= String(arg);
        if (op === 'lte') return val instanceof Date && arg instanceof Date ? val.getTime() <= arg.getTime() : String(val ?? '') <= String(arg);
        if (op === 'mode') return true;
        throw new Error(`unsupported operator ${op}`);
      });
    }
    return val === v;
  });
}

vi.mock('@/lib/db', () => {
  const withUniversity = (c: Rec) => ({ ...c, university: h.data.universityPage.find((u) => u.slug === c.universitySlug) || null });
  const model = (name: keyof typeof h.data) => ({
    findMany: vi.fn(async (args: any = {}) => {
      let rows = (h.data[name] as Rec[]).map((r) => (name === 'coursePage' ? withUniversity(r) : { ...r }));
      rows = rows.filter((r) => matches(r, args.where));
      if (name === 'universityPage' && args.select?.courses) {
        rows = rows.map((u) => ({ ...u, courses: h.data.coursePage.filter((c) => c.universitySlug === u.slug && matches(c, args.select.courses.where)) }));
      }
      return typeof args.take === 'number' ? rows.slice(0, args.take) : rows;
    }),
    findFirst: vi.fn(async (args: any = {}) => {
      const rows = await (h.db[name].findMany as any)({ ...args, take: undefined });
      return rows[0] ?? null;
    }),
    count: vi.fn(async (args: any = {}) => (await (h.db[name].findMany as any)({ where: args.where })).length),
  });
  const known: Rec = {
    universityPage: model('universityPage'),
    coursePage: model('coursePage'),
    dataConflict: model('dataConflict'),
    crmCourse: model('crmCourse'),
    crmScholarship: model('crmScholarship'),
    student: { findUnique: vi.fn(async () => ({ id: 'stu-1', name: 'Synthetic Student', profileComplete: true, currentCountry: '' })) },
  };
  const empty = { findMany: vi.fn(async () => []), findFirst: vi.fn(async () => null), findUnique: vi.fn(async () => null), count: vi.fn(async () => 0) };
  h.db = new Proxy(known, { get: (t, p: string) => (p in t ? t[p] : empty) });
  return { db: h.db };
});
vi.mock('@/lib/student-resource-auth', () => ({ requireStudentResource: vi.fn(async () => ({ studentId: 'stu-1' })) }));
vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: any, opts?: { requireUserTypes?: string[] }) => async (req: Request) => {
    const auth = h.auth.current;
    if (!auth) return new Response('{}', { status: 401 });
    if (opts?.requireUserTypes?.length && !opts.requireUserTypes.includes(auth.userType)) return new Response('{}', { status: 403 });
    return handler(req, auth);
  },
}));
vi.mock('next/navigation', () => ({
  notFound: () => { throw new Error('NEXT_NOT_FOUND'); },
  redirect: (url: string) => { throw new Error(`NEXT_REDIRECT:${url}`); },
}));
vi.mock('@/components/website/UniversityHub', () => ({ default: () => null }));
vi.mock('@/components/website/UniversityPageRecord', () => ({ default: () => null }));

import { NextRequest } from 'next/server';
import { GET as homepageGET } from '@/app/api/homepage/route';
import { GET as searchGET } from '@/app/api/search/route';
import { GET as eligibleGET } from '@/app/api/course-finder/eligible/route';
import { GET as studentCourseFinderGET } from '@/app/api/student-portal/course-finder/route';
import { GET as studentScholarshipsGET } from '@/app/api/student-portal/scholarships/route';
import { generateStudyGuide } from '@/lib/study-guide';
import CoursePageRoute from '@/app/courses/[slug]/page';
import UniversityPageRoute from '@/app/universities/[slug]/page';
import LegacyCourseRoute from '@/app/course/[slug]/page';
import sitemap from '@/app/sitemap';
import {
  passesPublicCoursePagePolicy,
  passesPublicInternationalCoursePagePolicy,
  publicCoursePageWhere,
  publicInternationalCoursePageWhere,
  publicUniversityPageWhere,
} from '@/lib/course-finder/public-content-page-policy';
import { publicCourseWhere } from '@/lib/public-catalog';
import { isStaticAssetBypass } from '@/proxy';

const OK_SRC = 'https://www.auckland.ac.nz/en/study/x.html';
const uni = (slug: string, over: Rec = {}) => ({ id: slug, slug, name: slug, city: 'Auckland', countrySlug: 'new-zealand', overview: `${slug} overview`, quickFacts: '{}', strengths: '[]', entryRequirements: '{}', tuition: '{}', applicationSteps: '[]', documents: '[]', faqs: '[]', approvalStatus: 'PUBLISHED', verificationStatus: 'VERIFIED', sourceUrl: OK_SRC, lastVerifiedAt: null, updatedAt: new Date(), ...over });
const course = (slug: string, over: Rec = {}) => ({ id: slug, slug, name: `Course ${slug}`, universitySlug: 'uni-ok', countrySlug: 'new-zealand', city: 'Auckland', level: 'Masters', subject: 'Data', duration: '', intake: '', tuition: '', scholarship: null, englishRequirement: '', academicRequirement: '', overview: `${slug} overview`, modules: '[]', careerOutcomes: '[]', documents: '[]', faqs: '[]', deadline: null, internationalEligibility: 'eligible', approvalStatus: 'PUBLISHED', verificationStatus: 'VERIFIED', sourceUrl: OK_SRC, lastVerifiedAt: null, updatedAt: new Date(), ...over });

const PUBLIC_COURSE = 'c-ok';
const HIDDEN_COURSES: Record<string, Rec> = {
  'c-unverified': { verificationStatus: 'UNVERIFIED' },
  'c-needs-review': { verificationStatus: 'NEEDS_REVIEW' },
  'c-conflicting-status': { verificationStatus: 'CONFLICTING_SOURCES' },
  'c-draft': { approvalStatus: 'DRAFT' },
  'c-pending': { approvalStatus: 'PENDING_REVIEW' },
  'c-no-source': { sourceUrl: null },
  'c-empty-source': { sourceUrl: '' },
  'c-http-source': { sourceUrl: 'http://www.auckland.ac.nz/x' },
  'c-synthetic-source': { sourceUrl: 'https://catalogue.example.com/x' },
  'c-open-conflict': {},
  'c-hidden-university': { universitySlug: 'uni-unverified' },
};

beforeEach(() => {
  h.auth.current = { userId: 'stu-1', userType: 'STUDENT', roles: [] };
  h.data.universityPage = [
    uni('uni-ok'),
    uni('uni-unverified', { verificationStatus: 'UNVERIFIED' }),
    uni('uni-draft', { approvalStatus: 'DRAFT' }),
    uni('uni-no-source', { sourceUrl: null }),
    uni('uni-conflict'),
  ];
  h.data.coursePage = [course(PUBLIC_COURSE), ...Object.entries(HIDDEN_COURSES).map(([slug, over]) => course(slug, over))];
  h.data.dataConflict = [
    { id: 'd1', status: 'PENDING', courseSlug: 'c-open-conflict', universitySlug: null },
    { id: 'd2', status: 'ESCALATED', courseSlug: null, universitySlug: 'uni-conflict' },
    { id: 'd3', status: 'RESOLVED', courseSlug: PUBLIC_COURSE, universitySlug: 'uni-ok' },
  ];
});

const slugs = (rows: Rec[]) => rows.map((r) => r.slug).sort();

describe('P0-C shared policy for UniversityPage / CoursePage', () => {
  it('only the verified, published, https-sourced, conflict-free course of a public university passes', async () => {
    const conflicts = { courseSlugs: ['c-open-conflict'], universitySlugs: ['uni-conflict'] };
    const visible = (await h.db.coursePage.findMany({ where: publicCoursePageWhere(conflicts) })).filter((c: Rec) => passesPublicCoursePagePolicy(c, conflicts));
    expect(slugs(visible)).toEqual([PUBLIC_COURSE]);
    const unis = await h.db.universityPage.findMany({ where: publicUniversityPageWhere(conflicts) });
    expect(slugs(unis)).toEqual(['uni-ok']);
  });

  it('the JS re-check rejects synthetic hosts that pass the SQL startsWith filter', () => {
    expect(passesPublicCoursePagePolicy(course('x', { sourceUrl: 'https://catalogue.example.com/x' }))).toBe(false);
    expect(passesPublicCoursePagePolicy(course('x'))).toBe(true);
  });

  it('international course pages require an explicit positive eligibility status', async () => {
    const conflicts = { courseSlugs: [], universitySlugs: [] };
    const eligible = course('eligible', { internationalEligibility: 'eligible for international students' });
    const unknown = course('unknown-eligibility', { internationalEligibility: 'not_verified' });
    const closed = course('closed-to-international', { internationalEligibility: 'domestic_only' });
    h.data.coursePage = [eligible, unknown, closed];
    const where = publicInternationalCoursePageWhere(conflicts);
    const visible = (await h.db.coursePage.findMany({ where })).filter((row: Rec) => passesPublicInternationalCoursePagePolicy(row, conflicts));
    expect(slugs(visible)).toEqual(['eligible']);
    expect(JSON.stringify(where)).toContain('internationalEligibility');
    expect(passesPublicInternationalCoursePagePolicy(unknown, conflicts)).toBe(false);
    expect(passesPublicInternationalCoursePagePolicy(closed, conflicts)).toBe(false);
  });
});

describe('P0-C public surfaces apply the policy', () => {
  it('homepage lists and counts only public catalogue pages', async () => {
    const body = await (await homepageGET()).json();
    expect(slugs(body.courses)).toEqual([PUBLIC_COURSE]);
    expect(slugs(body.universities)).toEqual(['uni-ok']);
    expect(body.stats.totalCourses).toBe(2); // SQL count: c-ok + c-synthetic-source (startsWith https); listing drops the synthetic one
    expect(body.stats.totalUniversities).toBe(1);
  });

  it('search cannot surface hidden records even when the query matches them', async () => {
    const body = await (await searchGET(new NextRequest('https://alo.test/api/search?q=overview'))).json();
    expect(slugs(body.courses)).toEqual([PUBLIC_COURSE]);
    expect(slugs(body.universities)).toEqual(['uni-ok']);
  });

  it('student eligibility scoring only uses public course pages', async () => {
    const body = await (await eligibleGET(new NextRequest('https://alo.test/api/course-finder/eligible?studentId=stu-1'))).json();
    expect(body.error).toBeUndefined();
    const listed = JSON.stringify(body);
    expect(listed).toContain(PUBLIC_COURSE);
    for (const hidden of Object.keys(HIDDEN_COURSES)) expect(listed, hidden).not.toContain(`"${hidden}"`);
  });

  it('the public study-guide endpoint no longer returns drafts or unverified pages by slug', async () => {
    expect(await generateStudyGuide(PUBLIC_COURSE)).not.toBeNull();
    for (const hidden of Object.keys(HIDDEN_COURSES)) expect(await generateStudyGuide(hidden), hidden).toBeNull();
  });

  it('direct /courses/[slug] URLs 404 for every hidden case', async () => {
    await expect(CoursePageRoute({ params: Promise.resolve({ slug: PUBLIC_COURSE }) })).resolves.toBeTruthy();
    for (const hidden of Object.keys(HIDDEN_COURSES)) {
      await expect(CoursePageRoute({ params: Promise.resolve({ slug: hidden }) }), hidden).rejects.toThrow('NEXT_NOT_FOUND');
    }
  });

  it('legacy /course/[slug] only redirects to a public course page', async () => {
    await expect(LegacyCourseRoute({ params: Promise.resolve({ slug: PUBLIC_COURSE }) })).rejects.toThrow(`NEXT_REDIRECT:/courses/${PUBLIC_COURSE}`);
    for (const hidden of ['c-draft', 'c-unverified', 'c-http-source', 'c-open-conflict']) {
      await expect(LegacyCourseRoute({ params: Promise.resolve({ slug: hidden }) }), hidden).rejects.toThrow('NEXT_NOT_FOUND');
    }
  });

  it('direct /universities/[slug] URLs 404 unless public, and embed only verified internationally eligible courses', async () => {
    h.data.coursePage.push(course('c-not-internationally-eligible', { internationalEligibility: 'not_verified' }));
    const el: any = await UniversityPageRoute({ params: Promise.resolve({ slug: 'uni-ok' }) });
    const embedded = slugs(el.props.university.courses);
    expect(embedded).toEqual([PUBLIC_COURSE]);
    for (const hidden of ['uni-unverified', 'uni-draft', 'uni-no-source', 'uni-conflict']) {
      await expect(UniversityPageRoute({ params: Promise.resolve({ slug: hidden }) }), hidden).rejects.toThrow('NEXT_NOT_FOUND');
    }
  });

  it('sitemap omits pages named by an open conflict', async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls.some((u) => u.endsWith(`/courses/${PUBLIC_COURSE}`))).toBe(true);
    expect(urls.some((u) => u.endsWith('/courses/c-open-conflict'))).toBe(false);
    expect(urls.some((u) => u.endsWith('/universities/uni-conflict'))).toBe(false);
  });

  it('fails closed (no catalogue rows) when the conflict lookup errors', async () => {
    (h.db.dataConflict.findMany as any).mockRejectedValueOnce(new Error('db down'));
    await expect(homepageGET()).rejects.toThrow('db down');
  });
});

describe('P0-C Crm* student surfaces use the canonical public gate', () => {
  const crmUni = { universityId: 'U1', status: 'active', verificationStatus: 'VERIFIED', publicationStatus: 'published', sourceUrl: OK_SRC, officialUrl: '' };
  const crm = (courseId: string, over: Rec = {}) => ({ courseId, universityId: 'U1', courseTitle: courseId, status: 'active', verificationStatus: 'VERIFIED', publicationStatus: 'published', sourceUrl: OK_SRC, officialUrl: '', internationalEligibility: 'eligible', createdAt: new Date(), university: crmUni, ...over });

  it('student-portal course finder excludes inactive, unverified, draft, source-less and conflicting rows', async () => {
    h.data.crmCourse = [
      crm('ok'), crm('inactive', { status: 'inactive' }), crm('unverified', { verificationStatus: 'NEEDS_REVIEW' }),
      crm('conflicting', { verificationStatus: 'CONFLICTING_SOURCES' }), crm('draft', { publicationStatus: 'draft' }),
      crm('nosource', { sourceUrl: '', officialUrl: '' }), crm('hidden-uni', { university: { ...crmUni, verificationStatus: 'NEEDS_REVIEW' } }),
    ];
    const res = await studentCourseFinderGET(new Request('https://alo.test/api/student-portal/course-finder'));
    const body = await res.json();
    expect(body.data.map((c: Rec) => c.courseId)).toEqual(['ok']);
    expect(body.total).toBe(1);
  });

  it('student-portal scholarships require a source-verified scholarship of a public university', async () => {
    h.data.crmScholarship = [
      { id: 's1', universityId: 'U1', courseId: '', status: 'active', verificationStatus: 'VERIFIED', officialScholarshipUrl: OK_SRC, lastCheckedAt: new Date().toISOString(), university: crmUni },
      { id: 's2', universityId: 'U1', courseId: '', status: 'active', verificationStatus: 'NEEDS_REVIEW', university: crmUni },
      { id: 's3', universityId: 'U1', courseId: '', status: 'active', verificationStatus: 'VERIFIED', university: { ...crmUni, publicationStatus: 'draft' } },
    ];
    const body = await (await studentScholarshipsGET(new Request('https://alo.test/api/student-portal/scholarships'))).json();
    expect(body.data.map((s: Rec) => s.id)).toEqual(['s1']);
  });

  it('publicCourseWhere itself rejects every non-public Crm case', () => {
    expect(matches(crm('ok'), publicCourseWhere())).toBe(true);
    for (const over of [{ status: 'inactive' }, { verificationStatus: 'CONFLICTING_SOURCES' }, { publicationStatus: 'draft' }, { sourceUrl: '', officialUrl: '' }]) {
      expect(matches(crm('x', over), publicCourseWhere()), JSON.stringify(over)).toBe(false);
    }
  });
});

describe('K4 review: static bypass is an allow-list', () => {
  it('a dotted path under a gated page outside ROLE_ROUTES no longer skips the proxy', () => {
    for (const p of ['/guides/x.pdf', '/guides/a.b', '/dashboard/x.json', '/some/deep/file.js', '/GUIDES/x.PNG', '/guides%2fx.pdf']) {
      expect(isStaticAssetBypass(p), p).toBe(false);
    }
  });
  it('real static locations still bypass', () => {
    for (const p of ['/_next/static/chunks/a.js', '/_next/image', '/images/hero.png', '/icons/i.svg', '/docs/guide.pdf', '/fonts/montserrat-latin-700-normal.woff2', '/fonts/open-sans-latin-400-italic.woff2', '/robots.txt', '/sitemap.xml', '/sw.js', '/manifest.json', '/logo.svg', '/favicon.ico', '/public/x.png']) {
      expect(isStaticAssetBypass(p), p).toBe(true);
    }
  });
  it('API and role-gated prefixes never bypass, whatever the encoding', () => {
    for (const p of ['/api/import-center.json', '/api%2Fcourse-finder/admin.css', '/admin/x.png', '/ADMIN/a.js', '/api/x.png']) {
      expect(isStaticAssetBypass(p), p).toBe(false);
    }
  });
});
