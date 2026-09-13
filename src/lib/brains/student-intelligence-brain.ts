/**
 * Student Intelligence Brain
 *
 * Aggregates a 360° intelligence view of a student: journey stage,
 * recommended next action, and funnel metrics.
 *
 * Functions:
 *   1. getStudentIntelligence(studentId)
 *   2. getJourneyStage(studentId)
 *   3. recommendNextAction(studentId)
 *   4. getStudentFunnelStats()
 */

import { db } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────

export type StudentJourneyStage =
  | "LEAD"
  | "COUNSELING"
  | "COURSE_SELECTION"
  | "UNIVERSITY_SELECTION"
  | "APPLICATION"
  | "DOCUMENTS"
  | "OFFER"
  | "CAS"
  | "VISA"
  | "ENROLLMENT"
  | "GRADUATED"
  | "INACTIVE";

export interface StudentIntelligence {
  studentId: string;
  studentCode: string | null;
  fullName: string;
  email: string;
  journeyStage: StudentJourneyStage;
  profileCompletion: number;
  applicationCount: number;
  activeApplications: number;
  documentCount: number;
  paymentTotal: number;
  lastActivityAt: Date | null;
  riskFlags: string[];
  nextAction: {
    action: string;
    reason: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  };
  counselor: { id: string; name: string } | null;
}

export interface JourneyStageResult {
  studentId: string;
  stage: StudentJourneyStage;
  stageLabel: string;
  reachedAt: Date;
  reason: string;
}

export interface NextActionRecommendation {
  action: string;
  reason: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}

export interface StudentFunnelStats {
  totalStudents: number;
  byStage: Record<StudentJourneyStage, number>;
  conversionRate: number; // lead-to-enrolled %
  averageTimeToEnrollment: number; // days
  stageDropoff: Record<string, number>; // stage → count of students who stalled
  inactiveStudents: number;
  atRiskStudents: number;
}

// ─── getStudentIntelligence ──────────────────────────────────────

/**
 * Compute the full intelligence view for a student.
 *
 * Aggregates data from Student, Lead, Application, Document, Payment,
 * TimelineEvent. Resolves the journey stage via getJourneyStage() and
 * the next action via recommendNextAction().
 */
export async function getStudentIntelligence(studentId: string): Promise<StudentIntelligence | null> {
  if (!studentId) return null;

  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      applications: { select: { id: true, stage: true, createdAt: true } },
      documents: { select: { id: true, status: true, createdAt: true } },
      payments: { select: { id: true, amount: true, status: true, type: true, createdAt: true } },
      counselor: { select: { id: true, name: true } },
    },
  });

  if (!student) return null;

  const journeyStageResult = await getJourneyStage(studentId);
  const nextAction = await recommendNextAction(studentId);

  // Risk flags
  const riskFlags: string[] = [];
  if (student.previousRefusal) riskFlags.push("Previous visa refusal");
  if (student.profileCompletion < 50) riskFlags.push("Profile incomplete (<50%)");
  if (student.englishTestStatus === "YET_TO_RECEIVE" && journeyStageResult.stage !== "LEAD") {
    riskFlags.push("English test not yet received");
  }
  if (student.bankStatementStatus === "NOT_STARTED" && journeyStageResult.stage === "APPLICATION") {
    riskFlags.push("Bank statement not started");
  }
  if (student.documents.length === 0 && journeyStageResult.stage !== "LEAD") {
    riskFlags.push("No documents uploaded");
  }

  // Payment total (only PAID)
  const paymentTotal = student.payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);

  // Active applications — exclude ENROLLED (terminal) and any rejected/withdrawn-style stages
  const TERMINAL_STAGES = new Set(["ENROLLED", "REJECTED", "WITHDRAWN"]);
  const activeApplications = student.applications.filter(
    (a) => !TERMINAL_STAGES.has(a.stage)
  ).length;

  // Last activity (most recent timeline event or document or payment)
  const allDates: Date[] = [
    ...student.applications.map((a) => a.createdAt),
    ...student.documents.map((d) => d.createdAt),
    ...student.payments.map((p) => p.createdAt as unknown as Date),
    student.updatedAt,
    student.createdAt,
  ].filter((d): d is Date => d instanceof Date && !isNaN(d.getTime()));

  const lastActivityAt = allDates.sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

  return {
    studentId: student.id,
    studentCode: student.studentId,
    fullName: student.fullName,
    email: student.email,
    journeyStage: journeyStageResult.stage,
    profileCompletion: student.profileCompletion,
    applicationCount: student.applications.length,
    activeApplications,
    documentCount: student.documents.length,
    paymentTotal,
    lastActivityAt,
    riskFlags,
    nextAction,
    counselor: student.counselor
      ? { id: student.counselor.id, name: student.counselor.name }
      : null,
  };
}

// ─── getJourneyStage ─────────────────────────────────────────────

/**
 * Determine the current journey stage for a student based on their
 * applications, documents, payments, and visa cases.
 *
 * Stage hierarchy (most-advanced wins):
 *   LEAD → COUNSELING → COURSE_SELECTION → UNIVERSITY_SELECTION →
 *   APPLICATION → DOCUMENTS → OFFER → CAS → VISA → ENROLLMENT → GRADUATED
 */
export async function getJourneyStage(studentId: string): Promise<JourneyStageResult> {
  if (!studentId) {
    return {
      studentId: "",
      stage: "INACTIVE",
      stageLabel: "Inactive",
      reachedAt: new Date(),
      reason: "No studentId provided",
    };
  }

  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      applications: { select: { id: true, stage: true, createdAt: true } },
      documents: { select: { id: true, status: true, createdAt: true } },
      visaCases: { select: { id: true, visaStage: true, createdAt: true } },
      payments: { select: { id: true, type: true, status: true, createdAt: true } },
    },
  });

  if (!student) {
    return {
      studentId,
      stage: "INACTIVE",
      stageLabel: "Inactive",
      reachedAt: new Date(),
      reason: "Student not found",
    };
  }

  // Determine most advanced stage
  let stage: StudentJourneyStage = "LEAD";
  let reachedAt = student.createdAt;
  let reason = "Student record created";

  // Check for ENROLLED application
  const enrolledApp = student.applications.find((a) => a.stage === "ENROLLED");
  if (enrolledApp) {
    return {
      studentId,
      stage: "ENROLLMENT",
      stageLabel: "Enrolled",
      reachedAt: enrolledApp.createdAt,
      reason: "Application marked as ENROLLED",
    };
  }

  // Check for active visa case
  const visaCase = student.visaCases[0];
  if (visaCase) {
    if (visaCase.visaStage === "VISA_APPROVED") {
      return {
        studentId,
        stage: "VISA",
        stageLabel: "Visa granted",
        reachedAt: visaCase.createdAt,
        reason: "Visa approved",
      };
    }
    stage = "VISA";
    reachedAt = visaCase.createdAt;
    reason = "Visa case opened";
  }

  // Check applications for OFFER / CAS stages (use Application.stage enum)
  const offerApp = student.applications.find((a) =>
    ["CONDITIONAL_OFFFER", "UNCONDITIONAL_OFFER", "CAS_INTERVIEW", "CAS_PENDING", "CAS_ISSUED"].includes(a.stage)
  );
  if (offerApp && (offerApp.stage === "CAS_ISSUED" || offerApp.stage === "CAS_PENDING")) {
    return {
      studentId,
      stage: "CAS",
      stageLabel: "CAS received",
      reachedAt: offerApp.createdAt,
      reason: "Application has CAS",
    };
  }
  if (offerApp) {
    return {
      studentId,
      stage: "OFFER",
      stageLabel: "Offer received",
      reachedAt: offerApp.createdAt,
      reason: "Application has offer",
    };
  }

  // Has any application → APPLICATION stage
  if (student.applications.length > 0) {
    // Has documents uploaded → DOCUMENTS stage
    if (student.documents.length > 0) {
      return {
        studentId,
        stage: "DOCUMENTS",
        stageLabel: "Documents in progress",
        reachedAt: student.documents[0].createdAt,
        reason: `${student.documents.length} document(s) uploaded`,
      };
    }
    return {
      studentId,
      stage: "APPLICATION",
      stageLabel: "Application submitted",
      reachedAt: student.applications[0].createdAt,
      reason: `${student.applications.length} application(s) submitted`,
    };
  }

  // Has preferred destination but no application → UNIVERSITY_SELECTION
  if (student.studyDestination && !student.programTitle) {
    return {
      studentId,
      stage: "UNIVERSITY_SELECTION",
      stageLabel: "University selection",
      reachedAt: student.updatedAt,
      reason: "Has destination, no program selected",
    };
  }
  if (student.programTitle) {
    return {
      studentId,
      stage: "COURSE_SELECTION",
      stageLabel: "Course selection",
      reachedAt: student.updatedAt,
      reason: "Program title selected",
    };
  }

  // Has counselor assigned → COUNSELING
  if (student.counselorId) {
    return {
      studentId,
      stage: "COUNSELING",
      stageLabel: "In counseling",
      reachedAt: student.updatedAt,
      reason: "Counselor assigned",
    };
  }

  // Default: LEAD
  return {
    studentId,
    stage,
    stageLabel: "Lead",
    reachedAt,
    reason,
  };
}

// ─── recommendNextAction ─────────────────────────────────────────

/**
 * Suggest the next best action for a student based on their journey stage
 * and risk flags.
 */
export async function recommendNextAction(studentId: string): Promise<NextActionRecommendation> {
  if (!studentId) {
    return { action: "No student selected", reason: "studentId required", priority: "LOW" };
  }

  const stageResult = await getJourneyStage(studentId);
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: {
      profileCompletion: true,
      englishTestStatus: true,
      bankStatementStatus: true,
      hasPassport: true,
      counselorId: true,
      previousRefusal: true,
    },
  });

  if (!student) {
    return { action: "Review student record", reason: "Student not found", priority: "LOW" };
  }

  // Stage-based recommendations
  switch (stageResult.stage) {
    case "LEAD":
      if (!student.counselorId) {
        return {
          action: "Assign a counselor",
          reason: "Lead has no counselor assigned — auto-assign or manually pick one",
          priority: "HIGH",
        };
      }
      return {
        action: "Schedule intro call",
        reason: "Lead has counselor but no intro call yet",
        priority: "HIGH",
      };

    case "COUNSELING":
      if (student.profileCompletion < 50) {
        return {
          action: "Complete student profile",
          reason: `Profile only ${student.profileCompletion}% complete — need destination, level, intake`,
          priority: "HIGH",
        };
      }
      return {
        action: "Shortlist courses",
        reason: "Profile complete — start course shortlisting",
        priority: "MEDIUM",
      };

    case "COURSE_SELECTION":
      return {
        action: "Shortlist universities",
        reason: "Course selected — narrow down to 3-5 universities",
        priority: "MEDIUM",
      };

    case "UNIVERSITY_SELECTION":
      return {
        action: "Start application",
        reason: "Universities shortlisted — begin application",
        priority: "HIGH",
      };

    case "APPLICATION":
      if (!student.hasPassport) {
        return {
          action: "Upload passport",
          reason: "Application in progress but no passport on file",
          priority: "URGENT",
        };
      }
      if (student.englishTestStatus === "YET_TO_RECEIVE") {
        return {
          action: "Book English test",
          reason: "English test not yet booked — required for application",
          priority: "HIGH",
        };
      }
      return {
        action: "Upload academic documents",
        reason: "Application in progress — collect transcripts and certificates",
        priority: "HIGH",
      };

    case "DOCUMENTS":
      if (student.bankStatementStatus === "NOT_STARTED") {
        return {
          action: "Start bank statement",
          reason: "Financial documents not started — 28-day rule applies",
          priority: "URGENT",
        };
      }
      return {
        action: "Submit application",
        reason: "Documents ready — submit application to university",
        priority: "HIGH",
      };

    case "OFFER":
      return {
        action: "Accept offer + request CAS",
        reason: "Offer received — accept and request CAS from university",
        priority: "HIGH",
      };

    case "CAS":
      return {
        action: "Apply for visa",
        reason: "CAS received — submit visa application",
        priority: "URGENT",
      };

    case "VISA":
      if (student.previousRefusal) {
        return {
          action: "Prepare for visa interview",
          reason: "Previous refusal on record — interview prep critical",
          priority: "URGENT",
        };
      }
      return {
        action: "Track visa decision",
        reason: "Visa application submitted — monitor for decision",
        priority: "HIGH",
      };

    case "ENROLLMENT":
      return {
        action: "Pre-departure briefing",
        reason: "Enrolled — schedule pre-departure briefing",
        priority: "MEDIUM",
      };

    case "GRADUATED":
      return {
        action: "Request review + referral",
        reason: "Graduated — request review and referral code",
        priority: "LOW",
      };

    case "INACTIVE":
    default:
      return {
        action: "Re-engage student",
        reason: "Student is inactive — send re-engagement message",
        priority: "MEDIUM",
      };
  }
}

// ─── getStudentFunnelStats ───────────────────────────────────────

/**
 * Aggregate funnel metrics across all students.
 *
 * Stage counts: distribution of students across journey stages.
 * Conversion rate: percentage of students who reached ENROLLMENT.
 * Average time to enrollment: mean days from createdAt to ENROLLMENT.
 * Stage dropoff: count of students stalled at each stage (no activity for 30+ days).
 */
export async function getStudentFunnelStats(): Promise<StudentFunnelStats> {
  const students = await db.student.findMany({
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      status: true,
      applications: { select: { id: true, stage: true, createdAt: true } },
      documents: { select: { id: true, createdAt: true } },
      visaCases: { select: { id: true, visaStage: true, createdAt: true } },
      payments: { select: { id: true, type: true, status: true, createdAt: true } },
    },
  });

  const byStage: Record<StudentJourneyStage, number> = {
    LEAD: 0,
    COUNSELING: 0,
    COURSE_SELECTION: 0,
    UNIVERSITY_SELECTION: 0,
    APPLICATION: 0,
    DOCUMENTS: 0,
    OFFER: 0,
    CAS: 0,
    VISA: 0,
    ENROLLMENT: 0,
    GRADUATED: 0,
    INACTIVE: 0,
  };

  const stageDropoff: Record<string, number> = {};
  let enrolledCount = 0;
  let totalDaysToEnrollment = 0;
  let inactiveCount = 0;
  let atRiskCount = 0;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

  for (const s of students) {
    // Determine stage
    const enrolledApp = s.applications.find((a) => a.stage === "ENROLLED");
    let stage: StudentJourneyStage;
    let stageReachedAt = s.createdAt;

    if (enrolledApp) {
      stage = "ENROLLMENT";
      stageReachedAt = enrolledApp.createdAt;
      enrolledCount++;
      const days = Math.floor((enrolledApp.createdAt.getTime() - s.createdAt.getTime()) / 86400000);
      if (days >= 0) totalDaysToEnrollment += days;
    } else if (s.visaCases.length > 0) {
      stage = "VISA";
      stageReachedAt = s.visaCases[0].createdAt;
    } else if (s.applications.some((a) => ["CAS_INTERVIEW", "CAS_PENDING", "CAS_ISSUED"].includes(a.stage))) {
      stage = "CAS";
    } else if (s.applications.some((a) => ["CONDITIONAL_OFFFER", "UNCONDITIONAL_OFFER"].includes(a.stage))) {
      stage = "OFFER";
    } else if (s.applications.length > 0 && s.documents.length > 0) {
      stage = "DOCUMENTS";
    } else if (s.applications.length > 0) {
      stage = "APPLICATION";
    } else {
      stage = "COUNSELING";
    }

    byStage[stage]++;

    // Dropoff: no activity for 30+ days
    if (s.updatedAt < thirtyDaysAgo) {
      stageDropoff[stage] = (stageDropoff[stage] ?? 0) + 1;
      if (s.status === "ACTIVE") atRiskCount++;
      if (s.status === "INACTIVE") inactiveCount++;
    }
  }

  const conversionRate = students.length > 0
    ? Math.round((enrolledCount / students.length) * 100)
    : 0;
  const averageTimeToEnrollment = enrolledCount > 0
    ? Math.round(totalDaysToEnrollment / enrolledCount)
    : 0;

  return {
    totalStudents: students.length,
    byStage,
    conversionRate,
    averageTimeToEnrollment,
    stageDropoff,
    inactiveStudents: inactiveCount,
    atRiskStudents: atRiskCount,
  };
}
