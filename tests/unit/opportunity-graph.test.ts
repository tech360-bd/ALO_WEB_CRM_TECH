// ALO Opportunity Graph contracts (spec s110, s16, s69, s92, s93, s105).
//
// The lib derives edges from live rows; tenant isolation is enforced one layer
// up in the route (a PARTNER with no linked application gets TENANT_MISMATCH),
// which tests/unit/api-authorization covers. Here we pin the derivation rules.
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    student: { findUnique: vi.fn() },
    application: { findMany: vi.fn(), count: vi.fn() },
    courseShortlist: { findMany: vi.fn() },
    visaCase: { findMany: vi.fn() },
    payment: { findMany: vi.fn() },
    commission: { findMany: vi.fn() },
    crmScholarship: { findMany: vi.fn() },
    crmUniversity: { findMany: vi.fn() },
    opportunityGraphEdge: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { db } from '@/lib/db';
import {
  computeStudentGraph,
  graphNeighbours,
  materialiseStudentGraph,
  recommendFromGraph,
} from '@/lib/intelligence/opportunity-graph';

const studentFindUnique = db.student.findUnique as unknown as ReturnType<typeof vi.fn>;
const applicationFindMany = db.application.findMany as unknown as ReturnType<typeof vi.fn>;
const shortlistFindMany = db.courseShortlist.findMany as unknown as ReturnType<typeof vi.fn>;
const visaCaseFindMany = db.visaCase.findMany as unknown as ReturnType<typeof vi.fn>;
const paymentFindMany = db.payment.findMany as unknown as ReturnType<typeof vi.fn>;
const commissionFindMany = db.commission.findMany as unknown as ReturnType<typeof vi.fn>;
const scholarshipFindMany = db.crmScholarship.findMany as unknown as ReturnType<typeof vi.fn>;
const universityFindMany = db.crmUniversity.findMany as unknown as ReturnType<typeof vi.fn>;
const edgeFindUnique = db.opportunityGraphEdge.findUnique as unknown as ReturnType<typeof vi.fn>;
const edgeFindMany = db.opportunityGraphEdge.findMany as unknown as ReturnType<typeof vi.fn>;
const edgeCreate = db.opportunityGraphEdge.create as unknown as ReturnType<typeof vi.fn>;
const edgeUpdate = db.opportunityGraphEdge.update as unknown as ReturnType<typeof vi.fn>;

function appRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'app-1',
    universityId: 'uni-aston',
    universityName: 'Aston University',
    courseId: 'course-ds',
    courseName: 'MSc Data Science',
    country: 'UK',
    stage: 'SUBMITTED_TO_UNIVERSITY',
    partnerId: 'PARTNER-A',
    counselorId: 'coun-1',
    offerStatus: 'PENDING',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  studentFindUnique.mockResolvedValue({ id: 'stu-1', name: 'Rahim', counselorId: 'coun-1' });
  applicationFindMany.mockResolvedValue([]);
  shortlistFindMany.mockResolvedValue([]);
  visaCaseFindMany.mockResolvedValue([]);
  paymentFindMany.mockResolvedValue([]);
  commissionFindMany.mockResolvedValue([]);
  scholarshipFindMany.mockResolvedValue([]);
  universityFindMany.mockResolvedValue([]);
  edgeFindUnique.mockResolvedValue(null);
  edgeFindMany.mockResolvedValue([]);
  edgeCreate.mockResolvedValue({ id: 'e-new' });
  edgeUpdate.mockResolvedValue({ id: 'e-old' });
});

describe('Every edge is traceable to a real row (s16, s92, s93)', () => {
  it('cites a table and id on every derived edge', async () => {
    applicationFindMany.mockResolvedValue([appRow()]);
    const graph = await computeStudentGraph('stu-1');
    expect(graph.edges.length).toBeGreaterThan(0);
    for (const edge of graph.edges) {
      expect(edge.evidence).toBeTruthy();
      expect(edge.evidence.table.length).toBeGreaterThan(0);
      expect(edge.evidence.id.length).toBeGreaterThan(0);
      expect(edge.weight).toBeGreaterThan(0);
      expect(edge.weight).toBeLessThanOrEqual(1);
    }
  });

  it('never derives an edge for a student with no activity', async () => {
    studentFindUnique.mockResolvedValue({ id: 'stu-9', name: 'Empty', counselorId: null });
    const graph = await computeStudentGraph('stu-9');
    expect(graph.edges).toEqual([]);
    expect(graph.stats.TOTAL_EDGES).toBe(0);
    // The student node itself still exists — the graph is not fabricated away.
    expect(graph.nodes).toEqual([{ type: 'STUDENT', id: 'stu-9', label: 'Empty' }]);
  });

  it('throws rather than returning an empty graph for an unknown student', async () => {
    studentFindUnique.mockResolvedValue(null);
    await expect(computeStudentGraph('ghost')).rejects.toThrow(/Student not found/);
  });

  it('labels an evidence source that only has a name, not an id', async () => {
    applicationFindMany.mockResolvedValue([appRow({ universityId: null, courseId: null })]);
    const graph = await computeStudentGraph('stu-1');
    const universityEdge = graph.edges.find((edge) => edge.relation === 'TARGETS_UNIVERSITY')!;
    expect(universityEdge.targetId).toBe('Aston University');
    expect(universityEdge.evidence.field).toBe('universityId');
  });
});

describe('Weights encode real progression, not guesswork', () => {
  it.each([
    ['UNCONDITIONAL_OFFER', 1],
    ['DEPOSIT_PAID', 1],
    ['CLOSED', 1],
    ['SUBMITTED_TO_UNIVERSITY', 0.8],
    ['DECISION_PENDING', 0.8],
    ['DRAFT', 0.4],
    ['', 0.4],
  ])('weights a %s application at %s', async (stage, expected) => {
    applicationFindMany.mockResolvedValue([appRow({ stage })]);
    const graph = await computeStudentGraph('stu-1');
    const edge = graph.edges.find((item) => item.relation === 'TARGETS_UNIVERSITY')!;
    expect(edge.weight).toBe(expected);
  });

  it('weights a granted visa case above a pending one', async () => {
    visaCaseFindMany.mockResolvedValue([
      { id: 'v1', destinationCountry: 'UK', university: 'Aston', currentStage: 'granted' },
      { id: 'v2', destinationCountry: 'CA', university: 'Toronto', currentStage: 'submitted' },
    ]);
    const graph = await computeStudentGraph('stu-1');
    const granted = graph.edges.find((edge) => edge.evidence.id === 'v1')!;
    const pending = graph.edges.find((edge) => edge.evidence.id === 'v2')!;
    expect(granted.weight).toBe(1);
    expect(pending.weight).toBe(0.5);
  });

  it('weights settled commission above unsettled', async () => {
    commissionFindMany.mockResolvedValue([
      { id: 'c1', amount: 500, status: 'RECEIVED', partnerId: 'PARTNER-A', universitySlug: 'aston' },
      { id: 'c2', amount: 500, status: 'DUE', partnerId: 'PARTNER-A', universitySlug: 'aston' },
    ]);
    const graph = await computeStudentGraph('stu-1');
    expect(graph.edges.find((edge) => edge.evidence.id === 'c1')!.weight).toBe(1);
    expect(graph.edges.find((edge) => edge.evidence.id === 'c2')!.weight).toBe(0.4);
  });

  it('weights a shortlisted course below an applied one', async () => {
    shortlistFindMany.mockResolvedValue([{ courseId: 'course-x', courseSlug: 'msc-x' }]);
    applicationFindMany.mockResolvedValue([appRow({ stage: 'UNCONDITIONAL_OFFER' })]);
    const graph = await computeStudentGraph('stu-1');
    const shortlisted = graph.edges.find((edge) => edge.relation === 'SHORTLISTED')!;
    const applied = graph.edges.find((edge) => edge.relation === 'TARGETS_COURSE')!;
    expect(shortlisted.weight).toBe(0.6);
    expect(applied.weight).toBe(1);
    expect(shortlisted.weight).toBeLessThan(applied.weight);
  });
});

describe('Unverified data is surfaced at reduced weight and labelled (s92, s105)', () => {
  it('halves the weight of an unverified scholarship and names its status', async () => {
    applicationFindMany.mockResolvedValue([appRow()]);
    scholarshipFindMany.mockResolvedValue([
      { id: 'sch-1', universityId: 'uni-aston', scholarshipName: 'Aston Merit', scholarshipAmount: 5000, awardPercentage: 25, scholarshipCurrency: 'GBP', deadline: null, verificationStatus: 'NEEDS_REVIEW' },
    ]);
    const graph = await computeStudentGraph('stu-1');
    const edge = graph.edges.find((item) => item.relation === 'FUNDED_BY')!;
    expect(edge.weight).toBe(0.5);
    expect(edge.label).toMatch(/NEEDS_REVIEW/);
  });

  it('gives a verified scholarship full weight', async () => {
    applicationFindMany.mockResolvedValue([appRow()]);
    scholarshipFindMany.mockResolvedValue([
      { id: 'sch-1', universityId: 'uni-aston', scholarshipName: 'Aston Merit', scholarshipAmount: 5000, awardPercentage: 0, scholarshipCurrency: 'GBP', deadline: null, verificationStatus: 'VERIFIED' },
    ]);
    const graph = await computeStudentGraph('stu-1');
    const edge = graph.edges.find((item) => item.relation === 'FUNDED_BY')!;
    expect(edge.weight).toBe(1);
    expect(edge.label).toMatch(/VERIFIED/);
  });

  it('labels a scholarship with no verification status as needing review', async () => {
    applicationFindMany.mockResolvedValue([appRow()]);
    scholarshipFindMany.mockResolvedValue([
      { id: 'sch-1', universityId: 'uni-aston', scholarshipName: 'Mystery', scholarshipAmount: 1000, awardPercentage: 0, scholarshipCurrency: 'GBP', deadline: null, verificationStatus: null },
    ]);
    const graph = await computeStudentGraph('stu-1');
    expect(graph.edges.find((item) => item.relation === 'FUNDED_BY')!.label).toMatch(/NEEDS_REVIEW/);
  });

  it('only looks for scholarships at universities the student really targeted', async () => {
    applicationFindMany.mockResolvedValue([appRow(), appRow({ id: 'app-2', universityId: 'uni-other' })]);
    await computeStudentGraph('stu-1');
    expect(scholarshipFindMany).toHaveBeenCalledTimes(1);
    expect(scholarshipFindMany.mock.calls[0][0].where.universityId.in).toEqual(['uni-aston', 'uni-other']);
    expect(scholarshipFindMany.mock.calls[0][0].where.status).toBe('active');
  });

  it('does not query scholarships at all with no targeted university', async () => {
    await computeStudentGraph('stu-1');
    expect(scholarshipFindMany).not.toHaveBeenCalled();
  });
});

describe('Graph shape and statistics', () => {
  it('includes the student node and every reached entity exactly once', async () => {
    applicationFindMany.mockResolvedValue([appRow()]);
    const graph = await computeStudentGraph('stu-1');
    const keys = graph.nodes.map((node) => `${node.type}:${node.id}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain('STUDENT:stu-1');
    expect(keys).toContain('UNIVERSITY:uni-aston');
    expect(keys).toContain('COUNTRY:UK');
    expect(keys).toContain('PARTNER:PARTNER-A');
  });

  it('counts nodes and edges consistently with the arrays returned', async () => {
    applicationFindMany.mockResolvedValue([appRow()]);
    const graph = await computeStudentGraph('stu-1');
    expect(graph.stats.TOTAL_NODES).toBe(graph.nodes.length);
    expect(graph.stats.TOTAL_EDGES).toBe(graph.edges.length);
  });

  it('counts each relation separately', async () => {
    applicationFindMany.mockResolvedValue([appRow()]);
    const graph = await computeStudentGraph('stu-1');
    expect(graph.stats.APPLIES_TO).toBe(1);
    expect(graph.stats.TARGETS_UNIVERSITY).toBe(1);
    expect(graph.stats.IN_COUNTRY).toBe(1);
    expect(graph.stats.ADVISED_BY).toBe(1);
  });

  it('stamps generatedAt from the injected clock', async () => {
    const now = new Date('2026-10-18T09:00:00.000Z');
    const graph = await computeStudentGraph('stu-1', { now });
    expect(graph.generatedAt).toBe('2026-10-18T09:00:00.000Z');
  });

  it('bounds traversal with a clamped limit', async () => {
    await computeStudentGraph('stu-1', { limit: 100000 });
    expect(applicationFindMany.mock.calls[0][0].take).toBe(1000);

    await computeStudentGraph('stu-1', { limit: 0 });
    expect(applicationFindMany.mock.calls[1][0].take).toBe(1);
  });
});

describe('Recommendations explain themselves (s16, s105)', () => {
  it('justifies a scholarship with the edges that produced it', async () => {
    applicationFindMany.mockResolvedValue([appRow()]);
    scholarshipFindMany.mockResolvedValue([
      { id: 'sch-1', universityId: 'uni-aston', scholarshipName: 'Aston Merit', scholarshipAmount: 5000, awardPercentage: 25, scholarshipCurrency: 'GBP', deadline: null, verificationStatus: 'VERIFIED' },
    ]);
    const items = await recommendFromGraph('stu-1');
    const scholarship = items.find((item) => item.kind === 'SCHOLARSHIP')!;
    expect(scholarship).toBeTruthy();
    expect(scholarship.becauseOf).toEqual([
      { relation: 'TARGETS_UNIVERSITY', via: 'uni-aston' },
      { relation: 'FUNDED_BY', via: 'sch-1' },
    ]);
    expect(scholarship.reason).toMatch(/Verified scholarship/);
    expect(scholarship.reason).toMatch(/5000/);
  });

  it('warns loudly about an unverified scholarship instead of asserting it', async () => {
    applicationFindMany.mockResolvedValue([appRow()]);
    scholarshipFindMany.mockResolvedValue([
      { id: 'sch-1', universityId: 'uni-aston', scholarshipName: 'Rumour', scholarshipAmount: 9000, awardPercentage: 0, scholarshipCurrency: 'GBP', deadline: null, verificationStatus: 'NEEDS_REVIEW' },
    ]);
    const items = await recommendFromGraph('stu-1');
    const scholarship = items.find((item) => item.kind === 'SCHOLARSHIP')!;
    expect(scholarship.reason).toMatch(/NOT VERIFIED/);
    expect(scholarship.reason).toMatch(/confirm against the official source/i);
    expect(scholarship.verificationStatus).toBe('NEEDS_REVIEW');
  });

  it('recommends nothing when the student has no real activity', async () => {
    studentFindUnique.mockResolvedValue({ id: 'stu-9', name: 'Empty', counselorId: null });
    const items = await recommendFromGraph('stu-9');
    expect(items).toEqual([]);
  });

  it('counts the real records behind a country recommendation', async () => {
    applicationFindMany.mockResolvedValue([appRow(), appRow({ id: 'app-2' })]);
    visaCaseFindMany.mockResolvedValue([{ id: 'v1', destinationCountry: 'UK', university: 'Aston', currentStage: 'submitted' }]);
    const items = await recommendFromGraph('stu-1');
    const country = items.find((item) => item.kind === 'COUNTRY' && item.id === 'UK')!;
    expect(country).toBeTruthy();
    expect(country.reason).toMatch(/3 real record/);
    expect(country.becauseOf.length).toBe(3);
  });

  it('says a funding gap is NOT_FOUND rather than claiming none exists', async () => {
    applicationFindMany.mockResolvedValue([appRow()]);
    scholarshipFindMany.mockResolvedValue([]);
    const items = await recommendFromGraph('stu-1');
    const university = items.find((item) => item.kind === 'UNIVERSITY')!;
    expect(university).toBeTruthy();
    expect(university.verificationStatus).toBe('NOT_FOUND');
    expect(university.reason).toMatch(/no active scholarship record was found/i);
    expect(university.reason).toMatch(/Check the official funding page/i);
  });

  it('does not report a funding gap where a scholarship edge already exists', async () => {
    applicationFindMany.mockResolvedValue([appRow()]);
    scholarshipFindMany.mockResolvedValue([
      { id: 'sch-1', universityId: 'uni-aston', scholarshipName: 'A', scholarshipAmount: 1000, awardPercentage: 0, scholarshipCurrency: 'GBP', deadline: null, verificationStatus: 'VERIFIED' },
    ]);
    const items = await recommendFromGraph('stu-1');
    expect(items.some((item) => item.kind === 'UNIVERSITY' && item.id === 'uni-aston')).toBe(false);
  });

  it('clamps the recommendation limit', async () => {
    applicationFindMany.mockResolvedValue([appRow()]);
    scholarshipFindMany.mockResolvedValue([
      { id: 'sch-1', universityId: 'uni-aston', scholarshipName: 'A', scholarshipAmount: 1000, awardPercentage: 0, scholarshipCurrency: 'GBP', deadline: null, verificationStatus: 'VERIFIED' },
    ]);
    await recommendFromGraph('stu-1', { limit: 9999 });
    // Call 0 belongs to the inner computeStudentGraph (default limit 200);
    // call 1 is the recommendation query itself.
    expect(scholarshipFindMany.mock.calls[1][0].take).toBe(50);
  });
});

describe('Materialisation is idempotent (s110)', () => {
  it('creates unseen edges and updates edges that already exist', async () => {
    applicationFindMany.mockResolvedValue([appRow()]);
    // The first lookup hits an existing row, the rest do not.
    edgeFindUnique.mockResolvedValueOnce({ id: 'e-existing' }).mockResolvedValue(null);

    const result = await materialiseStudentGraph('stu-1');
    expect(result.updated).toBe(1);
    expect(result.created).toBe(result.total - 1);
    expect(result.total).toBe(result.created + result.updated);
    expect(edgeUpdate).toHaveBeenCalledTimes(1);
    expect(edgeUpdate.mock.calls[0][0].where).toEqual({ id: 'e-existing' });
  });

  it('writes evidence as JSON and names the computation source', async () => {
    applicationFindMany.mockResolvedValue([appRow()]);
    await materialiseStudentGraph('stu-1');
    // The counselor edge is derived first, so look the application one up by relation.
    const applicationRow = edgeCreate.mock.calls
      .map((call: unknown[]) => (call[0] as { data: Record<string, unknown> }).data)
      .find((data) => data.relation === 'APPLIES_TO')!;
    expect(applicationRow.computedBy).toBe('SYSTEM');
    expect(JSON.parse(applicationRow.evidence as string)).toMatchObject({ table: 'Application', id: 'app-1' });
  });

  it('writes the composite unique key so re-runs upsert instead of duplicating', async () => {
    applicationFindMany.mockResolvedValue([appRow()]);
    await materialiseStudentGraph('stu-1');
    const data = edgeCreate.mock.calls[0][0].data;
    expect(data.sourceType).toBe('STUDENT');
    expect(data.sourceId).toBe('stu-1');
    expect(data.relation).toBeTruthy();
  });

  it('writes nothing for a student with no edges', async () => {
    studentFindUnique.mockResolvedValue({ id: 'stu-9', name: 'Empty', counselorId: null });
    const result = await materialiseStudentGraph('stu-9');
    expect(result).toMatchObject({ created: 0, updated: 0, total: 0 });
    expect(edgeCreate).not.toHaveBeenCalled();
    expect(edgeUpdate).not.toHaveBeenCalled();
  });

  it('refreshes weights on re-run so a progressed application re-ranks', async () => {
    // Pretend only the TARGETS_UNIVERSITY edge is already stored, so exactly one
    // update happens per run and its weight is unambiguous.
    edgeFindUnique.mockImplementation(async ({ where }: { where: Record<string, { relation: string }> }) => {
      const key = where.sourceType_sourceId_targetType_targetId_relation;
      return key.relation === 'TARGETS_UNIVERSITY' ? { id: 'e-university' } : null;
    });

    applicationFindMany.mockResolvedValue([appRow({ stage: 'DRAFT' })]);
    await materialiseStudentGraph('stu-1');
    expect(edgeUpdate).toHaveBeenCalledTimes(1);
    expect(edgeUpdate.mock.calls[0][0].where).toEqual({ id: 'e-university' });
    expect(edgeUpdate.mock.calls[0][0].data.weight).toBe(0.4);

    // The student progressed; re-running must overwrite the stale weight.
    applicationFindMany.mockResolvedValue([appRow({ stage: 'UNCONDITIONAL_OFFER' })]);
    await materialiseStudentGraph('stu-1');
    expect(edgeUpdate).toHaveBeenCalledTimes(2);
    expect(edgeUpdate.mock.calls[1][0].data.weight).toBe(1);
  });
});

describe('Neighbour traversal is bounded (graph explorer)', () => {
  it('walks both directions of a stored edge', async () => {
    edgeFindMany
      .mockResolvedValueOnce([{ relation: 'APPLIES_TO', sourceType: 'STUDENT', sourceId: 'stu-1', targetType: 'APPLICATION', targetId: 'app-1', weight: 1 }])
      .mockResolvedValueOnce([])
      .mockResolvedValue([]);
    const result = await graphNeighbours('STUDENT', 'stu-1', 1);
    expect(result.edges.some((edge: { relation: string }) => edge.relation === 'APPLIES_TO')).toBe(true);
  });

  it('clamps depth to a maximum of 3', async () => {
    edgeFindMany.mockResolvedValue([]);
    await graphNeighbours('STUDENT', 'stu-1', 99);
    // depth 1 => 2 queries per node (out + in); clamped to 3 => at most 6.
    expect(edgeFindMany.mock.calls.length).toBeLessThanOrEqual(6);
  });

  it('treats a depth of 0 as 1 rather than returning nothing', async () => {
    edgeFindMany.mockResolvedValue([]);
    await graphNeighbours('STUDENT', 'stu-1', 0);
    expect(edgeFindMany).toHaveBeenCalled();
  });

  it('does not revisit a node it has already expanded', async () => {
    edgeFindMany
      .mockResolvedValueOnce([{ relation: 'APPLIES_TO', sourceType: 'STUDENT', sourceId: 'stu-1', targetType: 'APPLICATION', targetId: 'app-1', weight: 1 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValue([]);
    await graphNeighbours('STUDENT', 'stu-1', 3);
    // stu-1 (2) + app-1 (2) = 4; a cycle back to stu-1 must not be expanded again.
    expect(edgeFindMany.mock.calls.length).toBe(4);
  });
});
