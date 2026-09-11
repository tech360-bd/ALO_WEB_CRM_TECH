/**
 * Student Intelligence Brain — aggregates real student/lead data to compute
 * intelligence, journey stage, next-action recommendations, and funnel stats.
 *
 * Journey stages (11):
 *   LEAD → COUNSELLING → APPLICATION_SUBMITTED → APPLICATION_REVIEW →
 *   OFFER_RECEIVED → OFFER_ACCEPTED → CAS_RECEIVED → VISA_APPLIED →
 *   VISA_APPROVED → ENROLLED → ALUMNI
 *
 * All stats REAL from DB.
 */

import { db } from "@/lib/db";

export const JOURNEY_STAGES = [
  "LEAD",
  "COUNSELLING",
  "APPLICATION_SUBMITTED",
  "APPLICATION_REVIEW",
  "OFFER_RECEIVED",
  "OFFER_ACCEPTED",
  "CAS_RECEIVED",
  "VISA_APPLIED",
  "VISA_APPROVED",
  "ENROLLED",
  "ALUMNI",
] as const;

export type JourneyStage = (typeof JOURNEY_STAGES)[number];

export interface StudentIntelligenceResult {
  student: {
    id: string;
    studentId: string;
    fullName: string;
    email: string;
    mobile: string;
    status: string;
    profileCompletion: number;
    counselorId: string | null;
  };
  journeyStage: JourneyStage;
  intelligence: {
    profileCompletion: number;
    hasPassport: boolean;
    hasEnglishTest: boolean;
    hasApplication: boolean;
    hasVisaCase: boolean;
    applicationCount: number;
    visaCaseCount: number;
    paymentCount: number;
    documentCount: number;
    timelineEventCount: number;
    riskFlags: string[];
    engagementScore: number;
  };
  recommendedActions: string[];
}

/**
 * Determine the journey stage for a student based on real related records.
 */
export async function getJourneyStage(studentId: string): Promise<JourneyStage | null> {
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { id: true, status: true, leadId: true },
  });
  if (!student) return null;

  // Check applications
  const applications = await db.application.findMany({
    where: { studentId },
    select: { id: true, stage: true },
    take: 50,
  });

  // Check visa cases
  const visaCases = await db.visaCase.findMany({
    where: { studentId },
    select: { id: true, visaStage: true },
    take: 50,
  });

  // Determine stage based on real data
  if (student.status === "GRADUATED") return "ALUMNI";

  // Visa stages
  const approvedVisa = visaCases.find(
    (v) => v.visaStage === "VISA_APPROVED" || v.visaStage === "GRANTED"
  );
  if (approvedVisa) return "VISA_APPROVED";
  if (visaCases.length > 0) return "VISA_APPLIED";

  // Application stages (uses `stage` not `status`)
  const acceptedOffer = applications.find(
    (a) =>
      a.stage === "UNCONDITIONAL_OFFER" ||
      a.stage === "DEPOSIT_PENDING" ||
      a.stage === "CAS_INTERVIEW" ||
      a.stage === "CAS_PENDING" ||
      a.stage === "CAS_ISSUED" ||
      a.stage === "ENROLLED"
  );
  if (acceptedOffer) {
    if (acceptedOffer.stage === "ENROLLED") return "ENROLLED";
    if (acceptedOffer.stage === "CAS_ISSUED") return "CAS_RECEIVED";
    return "OFFER_ACCEPTED";
  }
  const receivedOffer = applications.find(
    (a) => a.stage === "CONDITIONAL_OFFFER" || a.stage === "UNCONDITIONAL_OFFER"
  );
  if (receivedOffer) return "OFFER_RECEIVED";
  const inReview = applications.find(
    (a) =>
      a.stage === "APPLICATION_REVIEW" ||
      a.stage === "APPLICATION_PREPARING" ||
      a.stage === "APPLICATION_SUBMITTED"
  );
  if (inReview) return "APPLICATION_REVIEW";
  if (applications.length > 0) return "APPLICATION_SUBMITTED";

  // Has lead → in counselling
  if (student.leadId) return "COUNSELLING";

  return "LEAD";
}

/**
 * Get full intelligence summary for a student.
 */
export async function getStudentIntelligence(studentId: string): Promise<StudentIntelligenceResult | null> {
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      studentId: true,
      fullName: true,
      email: true,
      mobile: true,
      status: true,
      profileCompletion: true,
      counselorId: true,
      leadId: true,
      hasPassport: true,
      englishTestStatus: true,
      englishTests: true,
    },
  });

  if (!student) return null;

  const journeyStage = (await getJourneyStage(studentId)) || "LEAD";

  const [applications, visaCases, payments, documents, timelineEvents] = await Promise.all([
    db.application.count({ where: { studentId } }),
    db.visaCase.count({ where: { studentId } }),
    db.payment.count({ where: { studentId } }),
    db.document.count({ where: { studentId } }),
    db.timelineEvent.count({ where: { studentId } }),
  ]);

  // Risk flags
  const riskFlags: string[] = [];
  if (student.profileCompletion < 30) riskFlags.push("LOW_PROFILE_COMPLETION");
  if (!student.hasPassport) riskFlags.push("NO_PASSPORT");
  if (student.englishTestStatus === "YET_TO_RECEIVE") riskFlags.push("NO_ENGLISH_TEST");
  if (applications === 0 && student.leadId) riskFlags.push("NO_APPLICATION_SUBMITTED");

  // Engagement score (0-100): weighted combination
  const engagementScore = Math.min(
    100,
    student.profileCompletion * 0.3 +
      (student.hasPassport ? 10 : 0) +
      (student.englishTestStatus !== "YET_TO_RECEIVE" ? 10 : 0) +
      Math.min(applications * 10, 20) +
      Math.min(timelineEvents * 2, 20) +
      (visaCases > 0 ? 10 : 0)
  );

  // Recommended actions
  const recommendedActions: string[] = [];
  if (student.profileCompletion < 50) recommendedActions.push("Complete student profile (missing fields)");
  if (!student.hasPassport) recommendedActions.push("Collect passport scan");
  if (student.englishTestStatus === "YET_TO_RECEIVE") recommendedActions.push("Schedule English proficiency test");
  if (applications === 0 && journeyStage === "COUNSELLING") recommendedActions.push("Shortlist universities + submit first application");
  if (visaCases === 0 && applications > 0) recommendedActions.push("Prepare visa documents (financials, CAS)");
  if (student.counselorId === null) recommendedActions.push("Assign a counselor");

  return {
    student: {
      id: student.id,
      studentId: student.studentId,
      fullName: student.fullName,
      email: student.email,
      mobile: student.mobile,
      status: student.status,
      profileCompletion: student.profileCompletion,
      counselorId: student.counselorId,
    },
    journeyStage,
    intelligence: {
      profileCompletion: student.profileCompletion,
      hasPassport: student.hasPassport,
      hasEnglishTest: student.englishTestStatus !== "YET_TO_RECEIVE",
      hasApplication: applications > 0,
      hasVisaCase: visaCases > 0,
      applicationCount: applications,
      visaCaseCount: visaCases,
      paymentCount: payments,
      documentCount: documents,
      timelineEventCount: timelineEvents,
      riskFlags,
      engagementScore: Math.round(engagementScore),
    },
    recommendedActions,
  };
}

/**
 * Recommend the next best action for a student based on their journey stage.
 */
export async function recommendNextAction(studentId: string): Promise<{
  stage: JourneyStage | null;
  recommendedAction: string;
  rationale: string;
  alternativeActions: string[];
} | null> {
  const intelligence = await getStudentIntelligence(studentId);
  if (!intelligence) return null;

  const stage = intelligence.journeyStage;
  const primary = intelligence.recommendedActions[0] || "Maintain regular contact";

  const stageActionMap: Record<JourneyStage, { action: string; rationale: string }> = {
    LEAD: {
      action: "Schedule initial counselling call within 24 hours",
      rationale: "Lead has not yet entered counselling — early engagement critical.",
    },
    COUNSELLING: {
      action: "Shortlist 3-5 universities and submit first application",
      rationale: "In counselling but no applications submitted yet.",
    },
    APPLICATION_SUBMITTED: {
      action: "Follow up with university on application status",
      rationale: "Application submitted, awaiting review — proactive follow-up helps.",
    },
    APPLICATION_REVIEW: {
      action: "Prepare for possible interview / additional document requests",
      rationale: "Application under review — be ready for next-step requests.",
    },
    OFFER_RECEIVED: {
      action: "Accept offer + pay deposit within deadline",
      rationale: "Offer in hand — accept before deadline to secure seat.",
    },
    OFFER_ACCEPTED: {
      action: "Request CAS / Confirmation of Acceptance",
      rationale: "Offer accepted — CAS required for visa application.",
    },
    CAS_RECEIVED: {
      action: "Prepare + submit visa application",
      rationale: "CAS received — visa application is the next blocker.",
    },
    VISA_APPLIED: {
      action: "Prepare for visa interview + pre-departure briefing",
      rationale: "Visa in progress — interview prep and pre-departure reduce risk.",
    },
    VISA_APPROVED: {
      action: "Confirm enrollment + arrange accommodation and travel",
      rationale: "Visa approved — finalize logistics before enrollment.",
    },
    ENROLLED: {
      action: "Onboarding + first-week check-in",
      rationale: "Enrolled — ensure smooth transition and gather feedback.",
    },
    ALUMNI: {
      action: "Invite to alumni network + request testimonial",
      rationale: "Graduated — alumni engagement and referrals are high-value.",
    },
  };

  const stageAction = stageActionMap[stage];
  const alternativeActions = intelligence.recommendedActions.slice(1, 4);

  return {
    stage,
    recommendedAction: primary || stageAction.action,
    rationale: stageAction.rationale,
    alternativeActions,
  };
}

/**
 * Get funnel stats — REAL counts of students/leads at each stage.
 */
export async function getStudentFunnelStats() {
  const totalLeads = await db.lead.count();
  const totalStudents = await db.student.count();
  const totalApplications = await db.application.count();
  const totalVisaCases = await db.visaCase.count();

  // Lead status funnel
  const leadByStatus = await db.lead.groupBy({
    by: ["status"],
    _count: true,
  });

  // Application status funnel (uses `stage` not `status`)
  const appByStatus = await db.application.groupBy({
    by: ["stage"],
    _count: true,
  });

  // Visa case status funnel (uses `visaStage` not `status`)
  const visaByStatus = await db.visaCase.groupBy({
    by: ["visaStage"],
    _count: true,
  });

  // Student status
  const studentByStatus = await db.student.groupBy({
    by: ["status"],
    _count: true,
  });

  // Compute journey stage counts (best-effort — based on student status)
  const stageCounts: Record<string, number> = {};
  for (const stage of JOURNEY_STAGES) stageCounts[stage] = 0;
  stageCounts["LEAD"] = totalLeads;
  stageCounts["COUNSELLING"] = totalStudents - (studentByStatus.find((s) => s.status === "GRADUATED")?._count || 0);
  stageCounts["ALUMNI"] = studentByStatus.find((s) => s.status === "GRADUATED")?._count || 0;

  return {
    totalLeads,
    totalStudents,
    totalApplications,
    totalVisaCases,
    journeyStages: JOURNEY_STAGES,
    stageCounts,
    leadByStatus: leadByStatus.map((s: any) => ({ status: s.status, count: s._count })),
    applicationByStatus: appByStatus.map((s: any) => ({ status: s.stage, count: s._count })),
    visaByStatus: visaByStatus.map((s: any) => ({ status: s.visaStage, count: s._count })),
    studentByStatus: studentByStatus.map((s: any) => ({ status: s.status, count: s._count })),
  };
}
