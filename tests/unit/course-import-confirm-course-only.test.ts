import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  universityFindUnique: vi.fn(),
  universityUpdateMany: vi.fn(),
  universityCreate: vi.fn(),
  courseFindFirst: vi.fn(),
  courseCreate: vi.fn(),
  courseUpdateMany: vi.fn(),
  intakeFindMany: vi.fn(),
  intakeFindFirst: vi.fn(),
  intakeCreate: vi.fn(),
  requirementCreate: vi.fn(),
  scholarshipCreate: vi.fn(),
  commissionCreate: vi.fn(),
  portalAuditCreate: vi.fn(),
  importBatchCreate: vi.fn(),
  importErrorCreate: vi.fn(),
  crmAuditCreate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: (request: Request, auth: unknown) => Promise<Response>) => (request: Request) => handler(request, mocks.auth()),
}));
vi.mock('@/lib/request-origin', () => ({ mutationOriginAllowed: () => true }));
vi.mock('@/lib/db', () => ({
  db: {
    crmUniversity: { findUnique: mocks.universityFindUnique },
    crmCourse: { findFirst: mocks.courseFindFirst },
    crmCourseIntakeFee: { findMany: mocks.intakeFindMany },
    crmImportBatch: { create: mocks.importBatchCreate },
    crmImportError: { create: mocks.importErrorCreate },
    crmAuditLog: { create: mocks.crmAuditCreate },
    $transaction: mocks.transaction,
  },
}));

import { POST } from '@/app/api/crm/course-import/confirm/route';

const auth = {
  userId: 'admin-user',
  actorUserId: 'admin-user',
  userType: 'ADMIN',
  identityDomain: 'user',
};

const courseOnlyRow = {
  university_id: 'UNI-ASTON',
  university_name: 'Aston University',
  country: 'United Kingdom',
  course_id: 'ASTON-NEW-COURSE',
  course_title: 'Candidate Course',
  university_website: 'https://www.aston.ac.uk',
  university_official_url: 'https://www.aston.ac.uk',
  university_source_url: 'https://www.aston.ac.uk/courses-atoz',
  course_official_url: 'https://www.aston.ac.uk/study/courses/example',
  course_source_url: 'https://www.aston.ac.uk/study/courses/example',
  international_eligibility: 'not_verified',
  intake_year: '',
  intake_month: '',
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockReturnValue(auth);
  mocks.universityFindUnique.mockResolvedValue({
    id: 'uni-db-id', universityId: 'UNI-ASTON', name: 'Aston University',
    verificationStatus: 'VERIFIED', publicationStatus: 'published', updatedAt: new Date(),
  });
  mocks.courseFindFirst.mockResolvedValue(null);
  mocks.intakeFindMany.mockResolvedValue([]);
  mocks.intakeFindFirst.mockResolvedValue(null);
  mocks.importBatchCreate.mockResolvedValue({ id: 'batch-1' });
  mocks.importErrorCreate.mockResolvedValue({});
  mocks.crmAuditCreate.mockResolvedValue({});
  mocks.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn({
    crmUniversity: { findUnique: mocks.universityFindUnique, updateMany: mocks.universityUpdateMany, create: mocks.universityCreate },
    crmCourse: { findFirst: mocks.courseFindFirst, create: mocks.courseCreate, updateMany: mocks.courseUpdateMany },
    crmCourseIntakeFee: { findFirst: mocks.intakeFindFirst, create: mocks.intakeCreate },
    crmCourseRequirement: { create: mocks.requirementCreate },
    crmScholarship: { create: mocks.scholarshipCreate },
    crmCommission: { create: mocks.commissionCreate },
    portalAuditLog: { create: mocks.portalAuditCreate },
  }));
});

describe('POST /api/crm/course-import/confirm discovery staging', () => {
  it('stages a university-only destination candidate as a draft with no course or intake row', async () => {
    mocks.universityFindUnique.mockResolvedValue(null);
    const universityOnlyRow = {
      university_id: 'UNI-AU-0181', university_name: 'University of Melbourne', country: 'Australia',
      university_website: 'https://www.unimelb.edu.au',
      university_official_url: 'https://www.unimelb.edu.au',
      university_source_url: 'https://www.unimelb.edu.au',
      course_id: '', course_title: '', intake_year: '', intake_month: '',
    };
    const response = await POST(new Request('https://alo.test/api/crm/course-import/confirm', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://alo.test' },
      body: JSON.stringify({ importType: 'course_combined', batchName: 'Foreign destination shortlist', rows: [universityOnlyRow] }),
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ rowsImported: 1, rowsFailed: 0, rowsDuplicate: 0 });
    expect(mocks.universityCreate).toHaveBeenCalledWith({ data: expect.objectContaining({
      universityId: 'UNI-AU-0181', name: 'University of Melbourne', country: 'Australia',
      website: 'https://www.unimelb.edu.au', officialUrl: 'https://www.unimelb.edu.au',
      status: 'draft', verificationStatus: 'NEEDS_REVIEW', publicationStatus: 'draft',
    }) });
    expect(mocks.courseFindFirst).not.toHaveBeenCalled();
    expect(mocks.courseCreate).not.toHaveBeenCalled();
    expect(mocks.intakeCreate).not.toHaveBeenCalled();
  });

  it('stages a sourced candidate under a verified university without changing the university or inventing an intake', async () => {
    const request = new Request('https://alo.test/api/crm/course-import/confirm', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://alo.test' },
      body: JSON.stringify({ importType: 'course_combined', batchName: 'Aston candidate pages', rows: [courseOnlyRow] }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ rowsImported: 1, rowsFailed: 0, rowsDuplicate: 0 });
    expect(mocks.universityUpdateMany).not.toHaveBeenCalled();
    expect(mocks.universityCreate).not.toHaveBeenCalled();
    expect(mocks.courseCreate).toHaveBeenCalledWith({ data: expect.objectContaining({
      universityId: 'UNI-ASTON',
      courseId: 'ASTON-NEW-COURSE',
      courseTitle: 'Candidate Course',
      officialUrl: courseOnlyRow.course_official_url,
      sourceUrl: courseOnlyRow.course_source_url,
      internationalEligibility: 'not_verified',
      status: 'draft',
      verificationStatus: 'NEEDS_REVIEW',
      publicationStatus: 'draft',
    }) });
    expect(mocks.intakeFindFirst).not.toHaveBeenCalled();
    expect(mocks.intakeCreate).not.toHaveBeenCalled();
    expect(mocks.requirementCreate).not.toHaveBeenCalled();
  });

  it('rejects half an intake pair and an unsupported eligibility value before writing', async () => {
    const badRows = [
      { ...courseOnlyRow, intake_year: '2027' },
      { ...courseOnlyRow, course_id: 'ASTON-OTHER', international_eligibility: 'probably' },
    ];
    const response = await POST(new Request('https://alo.test/api/crm/course-import/confirm', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://alo.test' },
      body: JSON.stringify({ rows: badRows }),
    }));
    expect(response.status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
