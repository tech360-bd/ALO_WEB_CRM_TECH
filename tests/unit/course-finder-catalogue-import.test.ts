import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  classifyCatalogueRows,
  parseCatalogueCsv,
  sanitizeCell,
  summarize,
  toUpdateRequests,
  ImportParseError,
  type CatalogueLookup,
} from '../../src/lib/course-finder/catalogue-import-service';

const HEADER = 'University ID,University Name,Country,Website,Source URL,Course ID,Course Title,Study Level,Intake Year,Intake Month,Tuition Currency,Yearly Tuition,IELTS Overall';

function lookup(overrides: Partial<CatalogueLookup> = {}): CatalogueLookup {
  return {
    universities: async () => [{ universityId: 'UNI-1', name: 'University of Example', country: 'United Kingdom', website: 'https://www.example.ac.uk', sourceUrl: 'https://www.example.ac.uk/intl', verificationStatus: 'VERIFIED', publicationStatus: 'published' }],
    courses: async () => [{ courseId: 'CRS-1', universityId: 'UNI-1', courseTitle: 'MSc Data Science', studyLevel: 'Postgraduate', sourceUrl: 'https://www.example.ac.uk/intl', verificationStatus: 'VERIFIED', publicationStatus: 'published' }],
    intakeFees: async () => [{ courseId: 'CRS-1', intakeYear: 2027, intakeMonth: 'September', tuitionCurrency: 'GBP', yearlyTuition: 20000, verificationStatus: 'VERIFIED' }],
    requirements: async () => [{ courseId: 'CRS-1', ieltsOverall: 6.5, verificationStatus: 'VERIFIED' }],
    universityPool: async () => [{ id: 'UNI-1', name: 'University of Example', country: 'United Kingdom', website: 'https://www.example.ac.uk' }],
    ...overrides,
  };
}

const same = 'UNI-1,University of Example,United Kingdom,https://www.example.ac.uk,https://www.example.ac.uk/intl,CRS-1,MSc Data Science,Postgraduate,2027,September,GBP,20000,6.5';

describe('catalogue CSV parsing', () => {
  it('normalises headers, handles quoted commas and neutralises formula cells', () => {
    const rows = parseCatalogueCsv(`${HEADER}\nUNI-1,"University of Example, London",United Kingdom,,,CRS-1,"=HYPERLINK(""x"")",Postgraduate,2027,Sep,,,`);
    expect(rows[0].university_name).toBe('University of Example, London');
    expect(rows[0].course_title.startsWith("'")).toBe(true);
    expect(sanitizeCell('-12.5')).toBe('-12.5');
  });

  it('rejects files without required columns, duplicate headers, or too many rows', () => {
    expect(() => parseCatalogueCsv('a,b\n1,2')).toThrow(ImportParseError);
    expect(() => parseCatalogueCsv(`${HEADER},Course ID\n${same},x`)).toThrow(/Duplicate column/);
    const many = Array.from({ length: 501 }, () => same).join('\n');
    expect(() => parseCatalogueCsv(`${HEADER}\n${many}`)).toThrow(/Too many rows/);
  });
});

describe('same-data classification', () => {
  it('identical row → SKIP; formatting-only → NORMALIZE; no proposals', async () => {
    const rows = parseCatalogueCsv(`${HEADER}\n${same}\nUNI-1,university of example,united kingdom,http://example.ac.uk/,https://example.ac.uk/intl/,CRS-2,MSc AI,Postgraduate,2027,Sep,GBP,"20,000",6.5`);
    const res = await classifyCatalogueRows(rows, lookup({ courses: async () => [
      { courseId: 'CRS-1', universityId: 'UNI-1', courseTitle: 'MSc Data Science', studyLevel: 'Postgraduate', sourceUrl: 'https://www.example.ac.uk/intl', verificationStatus: 'VERIFIED' },
      { courseId: 'CRS-2', universityId: 'UNI-1', courseTitle: 'MSc AI', studyLevel: 'Postgraduate', sourceUrl: 'https://www.example.ac.uk/intl', verificationStatus: 'VERIFIED' },
    ], intakeFees: async () => [
      { courseId: 'CRS-1', intakeYear: 2027, intakeMonth: 'September', tuitionCurrency: 'GBP', yearlyTuition: 20000 },
      { courseId: 'CRS-2', intakeYear: 2027, intakeMonth: 'September', tuitionCurrency: 'GBP', yearlyTuition: 20000 },
    ], requirements: async () => [{ courseId: 'CRS-1', ieltsOverall: 6.5 }, { courseId: 'CRS-2', ieltsOverall: 6.5 }] }));
    expect(res[0].action).toBe('SKIP');
    expect(res[1].action).toBe('NORMALIZE');
    expect(toUpdateRequests(res)).toHaveLength(0);
  });

  it('material fee change on a published course → PENDING_CHANGE with a field-level proposal (evidence URL, no AI confidence)', async () => {
    const rows = parseCatalogueCsv(`${HEADER}\n${same.replace(',20000,', ',21500,')}`);
    const res = await classifyCatalogueRows(rows, lookup());
    expect(res[0].action).toBe('PENDING_CHANGE');
    const proposals = toUpdateRequests(res);
    expect(proposals).toEqual([expect.objectContaining({
      universityId: 'UNI-1', courseId: 'CRS-1', entityType: 'course', fieldName: 'intake:2027-09:yearlyTuition',
      oldValue: '20000', newValue: '21500', evidenceUrl: 'https://www.example.ac.uk/intl', aiConfidence: 0, status: 'pending_approval',
    })]);
  });

  it('new university that duplicates an existing website → BLOCK_DUPLICATE; genuinely new → NEW_PENDING_REVIEW', async () => {
    const rows = parseCatalogueCsv(`${HEADER}\nUNI-9,Example Uni,United Kingdom,http://example.ac.uk,https://example.ac.uk/x,CRS-9,BSc Law,Undergraduate,2027,September,,,\nUNI-7,Brand New University,Canada,https://brandnew.ca,https://brandnew.ca/intl,CRS-7,BA History,Undergraduate,2027,September,,,`);
    const res = await classifyCatalogueRows(rows, lookup({ universities: async () => [], courses: async () => [], intakeFees: async () => [], requirements: async () => [] }));
    expect(res[0].action).toBe('BLOCK_DUPLICATE');
    expect(res[1].action).toBe('NEW_PENDING_REVIEW');
    expect(summarize(res)).toMatchObject({ BLOCK_DUPLICATE: 1, NEW_PENDING_REVIEW: 1 });
  });

  it('invalid rows (bad year, non-URL source, repeated row, course owned by another university) are reported, never imported', async () => {
    const rows = parseCatalogueCsv(`${HEADER}\nUNI-1,University of Example,United Kingdom,,javascript:alert(1),CRS-1,MSc Data Science,Postgraduate,27,September,,,\n${same}\n${same}\nUNI-2,Other University,United Kingdom,,,CRS-1,MSc Data Science,Postgraduate,2027,September,,,`);
    const res = await classifyCatalogueRows(rows, lookup());
    expect(res[0].action).toBe('INVALID');
    expect(res[0].issues.map((i) => i.column)).toEqual(expect.arrayContaining(['intake_year', 'source_url']));
    expect(res[2].action).toBe('INVALID');
    expect(res[3].action).toBe('INVALID');
    expect(res[3].issues[0].message).toMatch(/already belongs/);
  });
});

// ---------------------------------------------------------------------------
// Route: /api/admin/data-import
// ---------------------------------------------------------------------------

const m = vi.hoisted(() => ({
  auth: vi.fn(),
  uniFindMany: vi.fn(), courseFindMany: vi.fn(), feeFindMany: vi.fn(), reqFindMany: vi.fn(),
  transaction: vi.fn(), batchCreate: vi.fn(), updFind: vi.fn(), updCreate: vi.fn(), errCreateMany: vi.fn(), audit: vi.fn(),
}));
vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: m.auth }));
vi.mock('@/lib/db', () => ({
  db: {
    crmUniversity: { findMany: m.uniFindMany },
    crmCourse: { findMany: m.courseFindMany },
    crmCourseIntakeFee: { findMany: m.feeFindMany },
    crmCourseRequirement: { findMany: m.reqFindMany },
    $transaction: m.transaction,
  },
}));

import { NextResponse } from 'next/server';
import { POST } from '@/app/api/admin/data-import/route';

function upload(csv: string, mode?: string, name = 'catalogue.csv') {
  const fd = new FormData();
  fd.append('file', new File([csv], name, { type: 'text/csv' }));
  if (mode) fd.append('mode', mode);
  return new Request('https://alo.test/api/admin/data-import', { method: 'POST', headers: { origin: 'https://alo.test' }, body: fd });
}

describe('POST /api/admin/data-import', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('NEXTAUTH_URL', 'https://alo.test');
    m.auth.mockResolvedValue({ userId: 'admin', actorUserId: 'actor', userType: 'ADMIN', identityDomain: 'portal', roles: [] });
    const l = lookup();
    m.uniFindMany.mockImplementation(async (q: { select?: unknown }) => (q?.select ? [{ universityId: 'UNI-1', name: 'University of Example', country: 'United Kingdom', website: 'https://www.example.ac.uk', officialUrl: '' }] : l.universities([])));
    m.courseFindMany.mockImplementation(() => l.courses([]));
    m.feeFindMany.mockImplementation(() => l.intakeFees([]));
    m.reqFindMany.mockImplementation(() => l.requirements([]));
    m.batchCreate.mockResolvedValue({ id: 'batch-1' });
    m.updFind.mockResolvedValue(null);
    m.transaction.mockImplementation((fn: (tx: unknown) => unknown) => fn({
      crmImportBatch: { create: m.batchCreate },
      universityUpdateRequest: { findFirst: m.updFind, create: m.updCreate },
      crmImportError: { createMany: m.errCreateMany },
      portalAuditLog: { create: m.audit },
    }));
  });

  it('requires an administrator identity (role claims alone are not enough) and same origin', async () => {
    m.auth.mockResolvedValueOnce(NextResponse.json({}, { status: 401 }));
    expect((await POST(upload(`${HEADER}\n${same}`))).status).toBe(401);
    m.auth.mockResolvedValueOnce({ userId: 's', userType: 'STUDENT', identityDomain: 'portal', roles: ['ADMIN'] });
    expect((await POST(upload(`${HEADER}\n${same}`))).status).toBe(403);
    const cross = upload(`${HEADER}\n${same}`);
    cross.headers.set('origin', 'https://attacker.test');
    cross.headers.set('sec-fetch-site', 'cross-site');
    expect((await POST(cross)).status).toBe(403);
    expect(m.transaction).not.toHaveBeenCalled();
  });

  it('preview writes nothing', async () => {
    const res = await POST(upload(`${HEADER}\n${same.replace(',20000,', ',21500,')}`));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.counts.PENDING_CHANGE).toBe(1);
    expect(body.published).toBe(false);
    expect(m.transaction).not.toHaveBeenCalled();
  });

  it('queue_changes queues proposals only (no live catalogue writes), de-duplicates pending ones and audits', async () => {
    const res = await POST(upload(`${HEADER}\n${same.replace(',20000,', ',21500,')}`, 'queue_changes'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toMatchObject({ batchId: 'batch-1', queued: 1, alreadyQueued: 0, published: false });
    expect(m.updCreate).toHaveBeenCalledTimes(1);
    expect(m.audit.mock.calls[0][0].data.action).toBe('CATALOG_IMPORT_CHANGES_QUEUED');
    m.updFind.mockResolvedValue({ id: 'existing' });
    const again = await (await POST(upload(`${HEADER}\n${same.replace(',20000,', ',21500,')}`, 'queue_changes'))).json();
    expect(again).toMatchObject({ queued: 0, alreadyQueued: 1 });
  });

  it('rejects XLSX honestly and non-CSV files', async () => {
    expect((await POST(upload('x', undefined, 'book.xlsx'))).status).toBe(415);
    expect((await POST(upload('x', undefined, 'notes.txt'))).status).toBe(415);
  });
});
