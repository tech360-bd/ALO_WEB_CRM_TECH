import { beforeEach, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ uni: vi.fn(), course: vi.fn(), unis: vi.fn(), courses: vi.fn(), empty: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { crmUniversity: { findFirst: m.uni, findMany: m.unis }, crmCourse: { findFirst: m.course, findMany: m.courses }, scholarship: { findMany: m.empty }, service: { findMany: m.empty }, resource: { findMany: m.empty } } }));
import { getRelatedContent, getUniversityBySlugDB, getCourseBySlugDB } from '@/lib/university-course/unified-service';
import { publicCourseWhere, publicRequirementWhere, publicUniversityWhere } from '@/lib/public-catalog';
beforeEach(() => { vi.resetAllMocks(); m.empty.mockResolvedValue([]); m.courses.mockResolvedValue([]); m.unis.mockResolvedValue([]); m.uni.mockResolvedValue(null); m.course.mockResolvedValue(null); });
it('related university/course filters reuse canonical visibility, including source and parent', async () => {
  await getRelatedContent('university', 'u', 'u', { universityId: 'u', country: 'UK', subjectArea: 'Business', studyLevel: 'Master' });
  for (const [query] of m.courses.mock.calls) expect(query.where.AND[0]).toEqual(publicCourseWhere());
  expect(m.unis.mock.calls[0][0].where.AND[0]).toEqual(publicUniversityWhere());
});
it('no static university fallback for unpublished records; exact identifiers only', async () => {
  expect(await getUniversityBySlugDB('oxford')).toBeNull();
  const query = m.uni.mock.calls[0][0]; expect(query.where.AND[0]).toEqual(publicUniversityWhere()); expect(JSON.stringify(query.where)).not.toContain('contains');
  expect(query.include.requirements.where).toEqual(publicRequirementWhere());
});
it('course helpers avoid commission query and recursively strip internal fields', async () => {
  m.course.mockResolvedValue({ id: 'c', internalNotes: 'private', university: { partnerNotes: 'private' } });
  expect(await getCourseBySlugDB('c')).toEqual({ id: 'c', university: {} });
  const query = m.course.mock.calls[0][0]; expect(query.where.AND[0]).toEqual(publicCourseWhere()); expect(query.include).not.toHaveProperty('commissions');
});
it('marketing lead view reuses real CRM rather than seeded mock data', async () => {
  const { readFileSync } = await import('node:fs'); const source = readFileSync('src/components/marketing/hub/LeadPipelineView.tsx', 'utf8');
  expect(source).toContain('<CrmLeadsPage'); expect(source).not.toContain('MOCK_LEADS');
});
