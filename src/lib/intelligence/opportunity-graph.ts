// ============================================================
// ALO EDUCATION — OPPORTUNITY GRAPH (spec s110, s105)
// ============================================================
// A graph layer over the canonical CRM entities:
//
//   Student ↔ Country ↔ University ↔ Course ↔ Scholarship
//           ↔ Visa ↔ Partner ↔ Counselor ↔ Commission
//
// Every edge is DERIVED FROM REAL ROWS and carries `evidence` naming the table
// and id it came from. Nothing is inferred, hallucinated or "probably related"
// (s105 data-source governance, s16 explainability, s93 no fake AI).
//
// Two modes:
//   * computeStudentGraph() — derive edges live from current rows
//   * materialiseStudentGraph() — persist them for fast reuse and trend queries
//
// The graph powers recommendations: scholarships attached to the universities a
// student actually applied to, partner/counselor accountability chains, and the
// country→course→funding path that a counselor should discuss next.
// ============================================================

import { db } from '@/lib/db';

export type GraphNodeType =
  | 'STUDENT'
  | 'COUNTRY'
  | 'UNIVERSITY'
  | 'COURSE'
  | 'SCHOLARSHIP'
  | 'VISA'
  | 'PARTNER'
  | 'COUNSELOR'
  | 'COMMISSION'
  | 'APPLICATION';

export type GraphRelation =
  | 'APPLIES_TO'
  | 'TARGETS_UNIVERSITY'
  | 'TARGETS_COURSE'
  | 'IN_COUNTRY'
  | 'SHORTLISTED'
  | 'ADVISED_BY'
  | 'REFERRED_BY'
  | 'OFFERS'
  | 'LOCATED_IN'
  | 'FUNDED_BY'
  | 'HAS_VISA_CASE'
  | 'EARNS'
  | 'DECIDED_BY';

export interface GraphEdge {
  sourceType: GraphNodeType;
  sourceId: string;
  targetType: GraphNodeType;
  targetId: string;
  relation: GraphRelation;
  weight: number;
  /** Provenance: which real row produced this edge. */
  evidence: { table: string; id: string; field?: string };
  label?: string;
}

export interface GraphNode {
  type: GraphNodeType;
  id: string;
  label: string;
}

export interface StudentGraph {
  studentId: string;
  generatedAt: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: Record<GraphRelation | 'TOTAL_NODES' | 'TOTAL_EDGES', number>;
}

export interface BuildGraphOptions {
  /** Cap on applications traversed. Keeps the query bounded. */
  limit?: number;
  now?: Date;
}

const DEFAULT_LIMIT = 200;

function pushEdge(
  edges: GraphEdge[],
  nodes: Map<string, GraphNode>,
  edge: GraphEdge,
  targetLabel?: string,
) {
  edges.push(edge);
  const targetKey = `${edge.targetType}:${edge.targetId}`;
  if (targetLabel && !nodes.has(targetKey)) {
    nodes.set(targetKey, { type: edge.targetType, id: edge.targetId, label: targetLabel });
  }
}

/**
 * Derive a student's opportunity graph from live rows. Pure read — no writes.
 */
export async function computeStudentGraph(
  studentId: string,
  options: BuildGraphOptions = {},
): Promise<StudentGraph> {
  const limit = Math.max(1, Math.min(options.limit ?? DEFAULT_LIMIT, 1000));
  const now = options.now ?? new Date();

  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { id: true, name: true, counselorId: true },
  });
  if (!student) throw new Error(`Student not found: ${studentId}`);

  const nodes = new Map<string, GraphNode>();
  nodes.set(`STUDENT:${student.id}`, {
    type: 'STUDENT',
    id: student.id,
    label: student.name || student.id,
  });

  const edges: GraphEdge[] = [];

  const [applications, shortlist, visaCases, payments] = await Promise.all([
    db.application.findMany({
      where: { studentId },
      select: {
        id: true,
        universityId: true,
        universityName: true,
        courseId: true,
        courseName: true,
        country: true,
        stage: true,
        partnerId: true,
        counselorId: true,
        offerStatus: true,
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    }),
    db.courseShortlist.findMany({
      where: { studentId },
      select: { courseId: true, courseSlug: true },
      take: limit,
    }),
    db.visaCase.findMany({
      where: { studentId },
      select: { id: true, destinationCountry: true, university: true, currentStage: true },
      take: limit,
    }),
    db.payment.findMany({
      where: { studentId },
      select: { id: true, type: true, status: true, partnerId: true },
      take: limit,
    }),
  ]);

  // ---- counselor ----
  if (student.counselorId) {
    const counselorKey = `COUNSELOR:${student.counselorId}`;
    if (!nodes.has(counselorKey)) {
      nodes.set(counselorKey, { type: 'COUNSELOR', id: student.counselorId, label: student.counselorId });
    }
    edges.push({
      sourceType: 'STUDENT',
      sourceId: student.id,
      targetType: 'COUNSELOR',
      targetId: student.counselorId,
      relation: 'ADVISED_BY',
      weight: 1,
      evidence: { table: 'Student', id: student.id, field: 'counselorId' },
    });
  }

  // ---- shortlisted courses ----
  for (const item of shortlist) {
    if (!item.courseId) continue;
    pushEdge(
      edges,
      nodes,
      {
        sourceType: 'STUDENT',
        sourceId: student.id,
        targetType: 'COURSE',
        targetId: item.courseId,
        relation: 'SHORTLISTED',
        weight: 0.6,
        evidence: { table: 'CourseShortlist', id: `${student.id}:${item.courseId}` },
      },
      item.courseSlug || item.courseId,
    );
  }

  // ---- applications ----
  for (const application of applications) {
    nodes.set(`APPLICATION:${application.id}`, {
      type: 'APPLICATION',
      id: application.id,
      label: `${application.courseName || 'Application'} — ${application.universityName || ''}`.trim(),
    });
    edges.push({
      sourceType: 'STUDENT',
      sourceId: student.id,
      targetType: 'APPLICATION',
      targetId: application.id,
      relation: 'APPLIES_TO',
      weight: 1,
      evidence: { table: 'Application', id: application.id, field: 'studentId' },
    });

    // A submitted/offer stage counts for more than a draft.
    const stage = String(application.stage || '').toUpperCase();
    const progressed =
      ['CONDITIONAL_OFFER', 'UNCONDITIONAL_OFFER', 'DEPOSIT_PAID', 'CAS_RECEIVED', 'I20_RECEIVED', 'COE_RECEIVED', 'CLOSED'].includes(stage)
        ? 1
        : ['SUBMITTED_TO_UNIVERSITY', 'ACKNOWLEDGEMENT_RECEIVED', 'DECISION_PENDING'].includes(stage)
          ? 0.8
          : 0.4;

    if (application.universityId || application.universityName) {
      const universityId = application.universityId || application.universityName;
      pushEdge(
        edges,
        nodes,
        {
          sourceType: 'APPLICATION',
          sourceId: application.id,
          targetType: 'UNIVERSITY',
          targetId: universityId,
          relation: 'TARGETS_UNIVERSITY',
          weight: progressed,
          evidence: { table: 'Application', id: application.id, field: 'universityId' },
        },
        application.universityName || universityId,
      );
    }
    if (application.courseId || application.courseName) {
      const courseId = application.courseId || application.courseName;
      pushEdge(
        edges,
        nodes,
        {
          sourceType: 'APPLICATION',
          sourceId: application.id,
          targetType: 'COURSE',
          targetId: courseId,
          relation: 'TARGETS_COURSE',
          weight: progressed,
          evidence: { table: 'Application', id: application.id, field: 'courseId' },
        },
        application.courseName || courseId,
      );
    }
    if (application.country) {
      pushEdge(
        edges,
        nodes,
        {
          sourceType: 'APPLICATION',
          sourceId: application.id,
          targetType: 'COUNTRY',
          targetId: application.country,
          relation: 'IN_COUNTRY',
          weight: progressed,
          evidence: { table: 'Application', id: application.id, field: 'country' },
        },
        application.country,
      );
    }
    if (application.partnerId) {
      pushEdge(
        edges,
        nodes,
        {
          sourceType: 'APPLICATION',
          sourceId: application.id,
          targetType: 'PARTNER',
          targetId: application.partnerId,
          relation: 'REFERRED_BY',
          weight: progressed,
          evidence: { table: 'Application', id: application.id, field: 'partnerId' },
        },
        application.partnerId,
      );
    }
    if (application.counselorId) {
      pushEdge(
        edges,
        nodes,
        {
          sourceType: 'APPLICATION',
          sourceId: application.id,
          targetType: 'COUNSELOR',
          targetId: application.counselorId,
          relation: 'DECIDED_BY',
          weight: progressed,
          evidence: { table: 'Application', id: application.id, field: 'counselorId' },
        },
        application.counselorId,
      );
    }
  }

  // ---- visa cases ----
  for (const visaCase of visaCases) {
    pushEdge(
      edges,
      nodes,
      {
        sourceType: 'STUDENT',
        sourceId: student.id,
        targetType: 'COUNTRY',
        targetId: visaCase.destinationCountry || 'UNKNOWN',
        relation: 'HAS_VISA_CASE',
        weight: String(visaCase.currentStage || '').toLowerCase() === 'granted' ? 1 : 0.5,
        evidence: { table: 'VisaCase', id: visaCase.id, field: 'destinationCountry' },
      },
      visaCase.destinationCountry || 'Unknown destination',
    );
  }

  // ---- commissions earned on this student ----
  const commissions = await db.commission.findMany({
    where: { studentId },
    select: { id: true, amount: true, status: true, partnerId: true, universitySlug: true },
    take: limit,
  });
  for (const commission of commissions) {
    pushEdge(
      edges,
      nodes,
      {
        sourceType: 'STUDENT',
        sourceId: student.id,
        targetType: 'COMMISSION',
        targetId: commission.id,
        relation: 'EARNS',
        // Settled money is worth more signal than an unsettled expectation.
        weight: ['RECEIVED', 'RECONCILED', 'CLOSED'].includes(String(commission.status || '').toUpperCase()) ? 1 : 0.4,
        evidence: { table: 'Commission', id: commission.id, field: 'studentId' },
      },
      `${commission.status} ${commission.amount}`,
    );
  }
  void payments;

  // ---- scholarships reachable from the student's real university targets ----
  const universityIds = Array.from(
    new Set(
      applications
        .map((application) => application.universityId)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  if (universityIds.length > 0) {
    const scholarships = await db.crmScholarship.findMany({
      where: { universityId: { in: universityIds }, status: 'active' },
      select: {
        id: true,
        universityId: true,
        courseId: true,
        scholarshipName: true,
        scholarshipAmount: true,
        awardPercentage: true,
        scholarshipCurrency: true,
        deadline: true,
        verificationStatus: true,
      },
      take: limit,
    });
    for (const scholarship of scholarships) {
      pushEdge(
        edges,
        nodes,
        {
          sourceType: 'UNIVERSITY',
          sourceId: scholarship.universityId,
          targetType: 'SCHOLARSHIP',
          targetId: scholarship.id,
          relation: 'FUNDED_BY',
          // Unverified scholarship data must not carry the same weight as
          // verified data (s105). It is still surfaced, just ranked lower and
          // labelled with its verification state.
          weight: String(scholarship.verificationStatus || '').toUpperCase() === 'VERIFIED' ? 1 : 0.5,
          evidence: { table: 'CrmScholarship', id: scholarship.id, field: 'universityId' },
          label: `${scholarship.scholarshipName || scholarship.id} (${scholarship.verificationStatus || 'NEEDS_REVIEW'})`,
        },
        scholarship.scholarshipName || scholarship.id,
      );
    }
  }

  // ---- university → course / country structure for reached universities ----
  if (universityIds.length > 0) {
    const universities = await db.crmUniversity.findMany({
      where: { universityId: { in: universityIds } },
      select: { universityId: true, name: true, country: true },
      take: limit,
    });
    for (const university of universities) {
      nodes.set(`UNIVERSITY:${university.universityId}`, {
        type: 'UNIVERSITY',
        id: university.universityId,
        label: university.name || university.universityId,
      });
      if (university.country) {
        pushEdge(
          edges,
          nodes,
          {
            sourceType: 'UNIVERSITY',
            sourceId: university.universityId,
            targetType: 'COUNTRY',
            targetId: university.country,
            relation: 'LOCATED_IN',
            weight: 1,
            evidence: { table: 'CrmUniversity', id: university.universityId, field: 'country' },
          },
          university.country,
        );
      }
    }
  }

  const stats = edges.reduce(
    (accumulator, edge) => {
      accumulator[edge.relation] = (accumulator[edge.relation] || 0) + 1;
      return accumulator;
    },
    {} as Record<string, number>,
  ) as Record<GraphRelation, number>;

  return {
    studentId: student.id,
    generatedAt: now.toISOString(),
    nodes: Array.from(nodes.values()),
    edges,
    stats: {
      ...stats,
      TOTAL_NODES: nodes.size,
      TOTAL_EDGES: edges.length,
    } as StudentGraph['stats'],
  };
}

/** Persist a computed graph. Idempotent via the unique edge key. */
export async function materialiseStudentGraph(studentId: string, options: BuildGraphOptions = {}) {
  const graph = await computeStudentGraph(studentId, options);
  let created = 0;
  let updated = 0;
  for (const edge of graph.edges) {
    const key = {
      sourceType_sourceId_targetType_targetId_relation: {
        sourceType: edge.sourceType,
        sourceId: edge.sourceId,
        targetType: edge.targetType,
        targetId: edge.targetId,
        relation: edge.relation,
      },
    };
    const existing = await db.opportunityGraphEdge.findUnique({ where: key });
    const data = {
      weight: edge.weight,
      evidence: JSON.stringify(edge.evidence),
      computedBy: 'SYSTEM',
    };
    if (existing) {
      await db.opportunityGraphEdge.update({ where: { id: existing.id }, data });
      updated += 1;
    } else {
      await db.opportunityGraphEdge.create({
        data: { ...data, ...key.sourceType_sourceId_targetType_targetId_relation },
      });
      created += 1;
    }
  }
  return { studentId, created, updated, total: graph.edges.length, nodes: graph.nodes.length };
}

// ============================================================
// Graph-powered recommendations (explainable, evidence-backed)
// ============================================================
export interface GraphRecommendation {
  kind: 'SCHOLARSHIP' | 'COUNTRY' | 'UNIVERSITY';
  id: string;
  label: string;
  reason: string;
  /** The real edges that justify this recommendation. */
  becauseOf: Array<{ relation: string; via: string }>;
  verificationStatus?: string;
}

export interface RecommendOptions {
  limit?: number;
}

/**
 * Recommend opportunities reachable from the student's REAL graph. Each
 * recommendation carries the edges that justify it — no unexplained scores.
 */
export async function recommendFromGraph(
  studentId: string,
  options: RecommendOptions = {},
): Promise<GraphRecommendation[]> {
  const limit = Math.max(1, Math.min(options.limit ?? 10, 50));
  const graph = await computeStudentGraph(studentId);

  // Universities the student actually targeted (via real applications).
  const targetedUniversityIds = new Set(
    graph.edges
      .filter((edge) => edge.relation === 'TARGETS_UNIVERSITY')
      .map((edge) => edge.targetId),
  );
  // Countries with real activity.
  const activeCountries = new Set(
    graph.edges
      .filter((edge) => edge.relation === 'IN_COUNTRY' || edge.relation === 'HAS_VISA_CASE')
      .map((edge) => edge.targetId),
  );

  const recommendations: GraphRecommendation[] = [];

  // Scholarships attached to universities the student really targeted.
  if (targetedUniversityIds.size > 0) {
    const scholarships = await db.crmScholarship.findMany({
      where: { universityId: { in: Array.from(targetedUniversityIds) }, status: 'active' },
      select: {
        id: true,
        universityId: true,
        scholarshipName: true,
        scholarshipAmount: true,
        awardPercentage: true,
        scholarshipCurrency: true,
        deadline: true,
        verificationStatus: true,
      },
      orderBy: [{ scholarshipAmount: 'desc' }],
      take: limit,
    });
    for (const scholarship of scholarships) {
      const verified = String(scholarship.verificationStatus || '').toUpperCase() === 'VERIFIED';
      recommendations.push({
        kind: 'SCHOLARSHIP',
        id: scholarship.id,
        label: scholarship.scholarshipName || scholarship.id,
        reason: verified
          ? `Verified scholarship at a university this student has applied to. Amount: ${scholarship.scholarshipAmount || 0} ${scholarship.scholarshipCurrency || ''}${scholarship.awardPercentage ? ` (${scholarship.awardPercentage}%)` : ''}.`
          : 'Scholarship at a university this student applied to. Verification status is NOT VERIFIED — confirm against the official source before advising.',
        becauseOf: [
          { relation: 'TARGETS_UNIVERSITY', via: scholarship.universityId },
          { relation: 'FUNDED_BY', via: scholarship.id },
        ],
        verificationStatus: scholarship.verificationStatus || 'NEEDS_REVIEW',
      });
    }
  }

  // Country concentration — where the student's activity actually is.
  for (const country of Array.from(activeCountries).slice(0, limit)) {
    const supporting = graph.edges.filter(
      (edge) =>
        (edge.relation === 'IN_COUNTRY' || edge.relation === 'HAS_VISA_CASE') && edge.targetId === country,
    );
    recommendations.push({
      kind: 'COUNTRY',
      id: country,
      label: country,
      reason: `${supporting.length} real record(s) tie this student to ${country}. Concentrating effort here avoids splitting a limited application budget.`,
      becauseOf: supporting.map((edge) => ({ relation: edge.relation, via: edge.evidence.table })),
    });
  }

  // Universities already targeted but with no scholarship edge yet.
  const fundedUniversities = new Set(
    graph.edges.filter((edge) => edge.relation === 'FUNDED_BY').map((edge) => edge.sourceId),
  );
  for (const universityId of Array.from(targetedUniversityIds)) {
    if (fundedUniversities.has(universityId)) continue;
    const label =
      graph.nodes.find((node) => node.type === 'UNIVERSITY' && node.id === universityId)?.label || universityId;
    recommendations.push({
      kind: 'UNIVERSITY',
      id: universityId,
      label,
      reason: 'Application exists at this university but no active scholarship record was found. Check the official funding page before telling the student no funding exists.',
      becauseOf: [{ relation: 'TARGETS_UNIVERSITY', via: universityId }],
      verificationStatus: 'NOT_FOUND',
    });
    if (recommendations.length >= limit * 3) break;
  }

  return recommendations.slice(0, limit * 3);
}

/** Neighbour lookup used by the graph explorer UI. */
export async function graphNeighbours(type: GraphNodeType, id: string, depth = 1) {
  const safeDepth = Math.max(1, Math.min(depth, 3));
  let frontier: Array<{ type: GraphNodeType; id: string }> = [{ type, id }];
  const visited = new Set<string>([`${type}:${id}`]);
  const collected: Array<{ relation: string; from: string; to: string; weight: number }> = [];

  for (let step = 0; step < safeDepth; step += 1) {
    if (frontier.length === 0) break;
    const next: Array<{ type: GraphNodeType; id: string }> = [];
    for (const node of frontier) {
      const outgoing = await db.opportunityGraphEdge.findMany({
        where: { sourceType: node.type, sourceId: node.id },
        take: 500,
      });
      const incoming = await db.opportunityGraphEdge.findMany({
        where: { targetType: node.type, targetId: node.id },
        take: 500,
      });
      for (const edge of outgoing) {
        collected.push({
          relation: edge.relation,
          from: `${edge.sourceType}:${edge.sourceId}`,
          to: `${edge.targetType}:${edge.targetId}`,
          weight: edge.weight,
        });
        const key = `${edge.targetType}:${edge.targetId}`;
        if (!visited.has(key)) {
          visited.add(key);
          next.push({ type: edge.targetType as GraphNodeType, id: edge.targetId });
        }
      }
      for (const edge of incoming) {
        collected.push({
          relation: edge.relation,
          from: `${edge.sourceType}:${edge.sourceId}`,
          to: `${edge.targetType}:${edge.targetId}`,
          weight: edge.weight,
        });
        const key = `${edge.sourceType}:${edge.sourceId}`;
        if (!visited.has(key)) {
          visited.add(key);
          next.push({ type: edge.sourceType as GraphNodeType, id: edge.sourceId });
        }
      }
    }
    frontier = next;
  }

  return { root: `${type}:${id}`, depth: safeDepth, nodes: Array.from(visited), edges: collected };
}
