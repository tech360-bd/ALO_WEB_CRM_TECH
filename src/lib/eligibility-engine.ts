// ALO Education — Intelligent Student Eligibility & Matching Engine
// Evaluates student profile against database course & university admission rules

export interface StudentProfileInput {
  fullName?: string;
  email?: string;
  phone?: string;
  nationality?: string;
  residenceCountry?: string;
  highestQualification?: string; // High School, Bachelors, Masters, Diploma
  gpaOrPercentage?: number; // e.g. 3.5 or 75
  gpaScale?: number; // 4.0, 5.0, 100
  studyGapYears?: number;
  englishTestType?: string; // IELTS, PTE, TOEFL, DUOLINGO, MOI, NONE
  englishOverall?: number;
  englishListening?: number;
  englishReading?: number;
  englishWriting?: number;
  englishSpeaking?: number;
  isEnglishExpired?: boolean;
  workExperienceMonths?: number;
  maxBudgetUsd?: number;
  preferredDestination?: string;
  preferredSubject?: string;
  preferredStudyLevel?: string;
}

export interface CourseRequirementInput {
  courseId: string;
  courseTitle: string;
  universityName: string;
  country: string;
  studyLevel: string;
  minGpaOrPercentage?: number;
  minIeltsOverall?: number;
  minIeltsSubscore?: number;
  maxAllowedStudyGapYears?: number;
  minWorkExpMonths?: number;
  tuitionFeeUsd?: number;
  availableToInternational?: boolean;
}

export type EligibilityCategory =
  | 'ELIGIBLE'
  | 'LIKELY_ELIGIBLE'
  | 'CONDITIONALLY_ELIGIBLE'
  | 'PARTIALLY_MATCHED'
  | 'NOT_CURRENTLY_ELIGIBLE'
  | 'INSUFFICIENT_INFO'
  | 'COUNSELLOR_REVIEW';

export interface RequirementComparisonItem {
  requirementName: string;
  universityRequirement: string;
  studentValue: string;
  passed: boolean;
  notes: string;
}

export interface EligibilityResult {
  category: EligibilityCategory;
  matchScorePercent: number; // 0 to 100
  summaryReason: string;
  comparisonTable: RequirementComparisonItem[];
  improvementPlan: string[];
  alternativeRoutes: string[];
}

export function evaluateCourseEligibility(
  student: StudentProfileInput,
  course: CourseRequirementInput
): EligibilityResult {
  const comparisonTable: RequirementComparisonItem[] = [];
  const improvementPlan: string[] = [];
  const alternativeRoutes: string[] = [];
  let scorePoints = 0;
  let totalPoints = 0;
  let failedMandatory = false;
  let conditionalNeeded = false;

  // 1. International Student Availability
  totalPoints += 10;
  if (course.availableToInternational === false) {
    failedMandatory = true;
    comparisonTable.push({
      requirementName: 'International Student Status',
      universityRequirement: 'Available to International Applicants',
      studentValue: 'International Applicant',
      passed: false,
      notes: 'This course is currently restricted to domestic applicants.',
    });
  } else {
    scorePoints += 10;
    comparisonTable.push({
      requirementName: 'International Student Status',
      universityRequirement: 'Available to International Applicants',
      studentValue: 'International Applicant',
      passed: true,
      notes: 'International applications open.',
    });
  }

  // 2. Academic Qualification & GPA / Percentage
  totalPoints += 30;
  const minGpa = course.minGpaOrPercentage || 3.0;
  const studentGpa = student.gpaOrPercentage || 0;

  if (!student.gpaOrPercentage) {
    comparisonTable.push({
      requirementName: 'Academic Result (GPA / %)',
      universityRequirement: `Minimum GPA / Percentage equivalent: ${minGpa}`,
      studentValue: 'Not Provided',
      passed: false,
      notes: 'Academic transcript or result pending verification.',
    });
    conditionalNeeded = true;
  } else if (studentGpa >= minGpa) {
    scorePoints += 30;
    comparisonTable.push({
      requirementName: 'Academic Result (GPA / %)',
      universityRequirement: `Minimum requirement: ${minGpa}`,
      studentValue: `Student result: ${studentGpa}`,
      passed: true,
      notes: 'Meets minimum academic threshold.',
    });
  } else {
    failedMandatory = true;
    const diff = (minGpa - studentGpa).toFixed(2);
    comparisonTable.push({
      requirementName: 'Academic Result (GPA / %)',
      universityRequirement: `Minimum requirement: ${minGpa}`,
      studentValue: `Student result: ${studentGpa}`,
      passed: false,
      notes: `Below requirement by ${diff} points.`,
    });
    improvementPlan.push(`Consider a Foundation, International Year One, or Pre-Master's pathway to bridge academic GPA requirements.`);
    alternativeRoutes.push(`Explore Foundation or Diploma progression routes for ${course.universityName}.`);
  }

  // 3. English Language Proficiency & Expiry
  totalPoints += 30;
  const reqIelts = course.minIeltsOverall || 6.5;
  const studentScore = student.englishOverall || 0;

  if (student.isEnglishExpired) {
    conditionalNeeded = true;
    comparisonTable.push({
      requirementName: 'English Proficiency Test',
      universityRequirement: `IELTS ${reqIelts} or equivalent (valid test date)`,
      studentValue: `${student.englishTestType || 'IELTS'} ${studentScore} (Expired)`,
      passed: false,
      notes: 'Test result has expired (2-year validity exceeded). Retake or waiver required.',
    });
    improvementPlan.push('Your English test result has expired (validity 2 years). Retake IELTS/PTE or apply for a university test waiver.');
  } else if (student.englishTestType === 'MOI' || student.englishTestType === 'NONE') {
    conditionalNeeded = true;
    comparisonTable.push({
      requirementName: 'English Proficiency Test',
      universityRequirement: `IELTS ${reqIelts} or equivalent`,
      studentValue: student.englishTestType === 'MOI' ? 'Medium of Instruction (MOI)' : 'No Test Score Yet',
      passed: false,
      notes: 'Conditional offer possible pending official test score or university MOI waiver assessment.',
    });
    improvementPlan.push(`Book and take an IELTS Academic / PTE Academic test targeting overall ${reqIelts}.`);
    improvementPlan.push(`Apply for a Pre-sessional English course at ${course.universityName} if required.`);
  } else if (studentScore >= reqIelts) {
    scorePoints += 30;
    comparisonTable.push({
      requirementName: 'English Proficiency Test',
      universityRequirement: `IELTS overall ${reqIelts}`,
      studentValue: `${student.englishTestType || 'IELTS'} overall ${studentScore}`,
      passed: true,
      notes: 'Meets English language requirement.',
    });
  } else {
    conditionalNeeded = true;
    comparisonTable.push({
      requirementName: 'English Proficiency Test',
      universityRequirement: `IELTS overall ${reqIelts}`,
      studentValue: `${student.englishTestType || 'IELTS'} overall ${studentScore}`,
      passed: false,
      notes: `Short by ${(reqIelts - studentScore).toFixed(1)} bands. Pre-sessional English or test retake required.`,
    });
    improvementPlan.push(`Retake ${student.englishTestType || 'IELTS'} focusing on overall ${reqIelts} or enroll in a 6-12 week Pre-sessional English module.`);
  }

  // 4. Study Gap Assessment
  totalPoints += 15;
  const maxGap = course.maxAllowedStudyGapYears || 3;
  const studentGap = student.studyGapYears || 0;

  if (studentGap <= maxGap) {
    scorePoints += 15;
    comparisonTable.push({
      requirementName: 'Study Gap Assessment',
      universityRequirement: `Maximum standard gap: ${maxGap} years`,
      studentValue: `${studentGap} years`,
      passed: true,
      notes: 'Study gap within acceptable threshold.',
    });
  } else {
    comparisonTable.push({
      requirementName: 'Study Gap Assessment',
      universityRequirement: `Maximum standard gap: ${maxGap} years`,
      studentValue: `${studentGap} years`,
      passed: false,
      notes: 'Study gap exceeds standard threshold. Work experience letters or statement of activity required.',
    });
    improvementPlan.push('Prepare official work experience certificates, appointment letters, and bank statements covering the study gap period.');
  }

  // 5. Tuition Budget Compatibility
  totalPoints += 15;
  const fee = course.tuitionFeeUsd || 25000;
  const budget = student.maxBudgetUsd || 30000;

  if (budget >= fee) {
    scorePoints += 15;
    comparisonTable.push({
      requirementName: 'Tuition Affordability',
      universityRequirement: `Yearly Tuition: USD $${fee.toLocaleString()}`,
      studentValue: `Budget Limit: USD $${budget.toLocaleString()}`,
      passed: true,
      notes: 'Tuition within student budget preference.',
    });
  } else {
    comparisonTable.push({
      requirementName: 'Tuition Affordability',
      universityRequirement: `Yearly Tuition: USD $${fee.toLocaleString()}`,
      studentValue: `Budget Limit: USD $${budget.toLocaleString()}`,
      passed: false,
      notes: `Tuition exceeds budget by USD $${(fee - budget).toLocaleString()}. Scholarship application recommended.`,
    });
    improvementPlan.push(`Apply for ALO partner merit scholarships or consider universities in Germany/Ireland with lower tuition fees.`);
    alternativeRoutes.push(`Explore lower tuition options in ${course.country} matching ${course.studyLevel}.`);
  }

  const matchPercent = Math.round((scorePoints / totalPoints) * 100);

  // Categorize
  let category: EligibilityCategory = 'ELIGIBLE';
  let summaryReason = 'Student meets all primary academic, English, and financial criteria for direct entry.';

  if (!student.gpaOrPercentage && !student.englishOverall) {
    category = 'INSUFFICIENT_INFO';
    summaryReason = 'Additional academic and English test information required to complete evaluation.';
  } else if (failedMandatory) {
    category = 'NOT_CURRENTLY_ELIGIBLE';
    summaryReason = 'Does not meet current minimum academic or entry criteria for direct entry. Pathway routes available.';
  } else if (conditionalNeeded) {
    category = 'CONDITIONALLY_ELIGIBLE';
    summaryReason = 'Qualifies for a Conditional Offer pending final English test score or academic documentation.';
  } else if (matchPercent < 80) {
    category = 'PARTIALLY_MATCHED';
    summaryReason = 'Meets core qualification rules but requires counsellor review for study gap or subscore verification.';
  }

  return {
    category,
    matchScorePercent: matchPercent,
    summaryReason,
    comparisonTable,
    improvementPlan,
    alternativeRoutes,
  };
}
